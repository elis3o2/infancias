from copy import deepcopy
from datetime import date
from types import SimpleNamespace
from unittest.mock import patch

from django.apps import apps
from django.db import connection
from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory, force_authenticate

from src.apps.api_externa.types import Ciudadano
from src.apps.domicilio.models import (
    Departamento, Domicilio, Institucion, Provincia, TipoInstitucion,
)
from src.apps.persona.models import (
    Adolescente, AdolescenteInstitucion, Carpeta, Familiar, Legajo, Persona,
    PersonaDomicilio, Relacion, RelacionAdolescente, Vinculo,
)
from src.apps.solicitud.models import MotivoSolicitud, Solicitud
from src.apps.solicitud.serializers import SolicitudCreateSerializer, SolicitudValidateSerializer
from src.apps.solicitud.services import crear_solicitud, validar_solicitud
from src.apps.solicitud.views import SolicitudViewSet
from src.models import Equipo


class SolicitudAdolescentesTests(TestCase):
    """Modelos reales y transacciones; únicamente los proveedores se simulan."""

    @classmethod
    def setUpClass(cls):
        # Las tablas históricas tienen managed=False y migrate no las crea.
        # Este esquema existe únicamente en la conexión SQLite de pruebas.
        if connection.vendor != "sqlite" or "memory" not in connection.settings_dict["NAME"]:
            raise RuntimeError("Estas pruebas requieren SQLite en memoria.")
        cls.modelos_externos = [
            modelo for modelo in apps.get_models() if not modelo._meta.managed
        ]
        with connection.schema_editor() as editor:
            for modelo in cls.modelos_externos:
                editor.create_model(modelo)
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        with connection.schema_editor() as editor:
            for modelo in reversed(cls.modelos_externos):
                editor.delete_model(modelo)

    def setUp(self):
        self.red = patch(
            "requests.sessions.Session.request",
            side_effect=AssertionError("Las pruebas no deben realizar solicitudes HTTP."),
        ).start()
        self.ciudadano = patch(
            "src.apps.persona.services.consultar_ciudadano",
            side_effect=self._ciudadano,
        ).start()
        self.correo = patch("src.apps.solicitud.services.enviar_correo").start()
        self.addCleanup(patch.stopall)

        self.entrada = Equipo.objects.create(id=1, nombre="Entrada")
        Equipo.objects.create(id=2, nombre="Admisión")
        self.motivo = MotivoSolicitud.objects.create(nombre="Consulta")
        provincia = Provincia.objects.create(nombre="Santa Fe")
        self.departamento = Departamento.objects.create(nombre="Rosario", provincia=provincia)
        self.domicilio = Domicilio.objects.create(nombre="Domicilio de prueba", departamento=self.departamento)
        self.tipo = TipoInstitucion.objects.create(nombre="Escuela")
        self.institucion = Institucion.objects.create(
            nombre="Escuela de prueba", domicilio=self.domicilio, tipo=self.tipo,
        )
        self.referencia = Institucion.objects.create(
            nombre="Institución de referencia", domicilio=self.domicilio, tipo=self.tipo,
        )
        self.vinculo = Vinculo.objects.create(nombre="Referente", adolescente=False)
        self.vinculo_adolescente = Vinculo.objects.create(
            nombre="Hermano", adolescente=True,
        )

    @staticmethod
    def _ciudadano(dni, sexo):
        return Ciudadano(
            nombre="Nombre verificado", apellido="Apellido verificado",
            nroDocumento=int(dni), sexo=sexo,
            fechaNacimiento="Mon, 18 Feb 2008 00:00:00 GMT",
        )

    def _domicilio_input(self):
        return {"nombre": "Nuevo domicilio", "id_departamento": self.departamento.pk}

    def _solicitud(self):
        return Solicitud.objects.create(
            motivo=self.motivo, correo="prueba@example.test", telefono="123456",
            descripcion="Solicitud de prueba", fecha_hora_creacion=timezone.now(),
            validado=False, rechazado=False, equipo=self.entrada,
        )

    def _adolescente(self, solicitud, dni):
        return Adolescente.objects.create(
            solicitud=solicitud, dni=dni, sexo="M",
            nombre="Nombre declarado", apellido="Apellido declarado",
            fecha_nacimiento=date(2008, 2, 18), domicilio=self.domicilio,
        )

    def _familiar(self, adolescente, dni="30000001"):
        return Familiar.objects.create(
            solicitud=adolescente.solicitud, adolescente=adolescente,
            dni=dni, sexo="F", nombre="Referente", apellido="De prueba",
            vinculo=self.vinculo,
        )

    def _persona(self, dni, **datos):
        campos = {
            "dni": dni, "sexo": "M", "nombre": "Persona existente",
            "apellido": "De prueba", "fecha_nacimiento": date(2008, 2, 18),
            "discapacidades": False, "consumos_problematicos": False,
            "intentos_de_suicidio": False, "problemas_socioambientales": False,
            "violencias": False,
        }
        campos.update(datos)
        return Persona.objects.create(**campos)

    def _datos_validacion(self, adolescentes):
        return {"adolescentes": [
            {
                "id": adolescente.pk, "salud": {},
                "familiares": [
                    {"id": familiar.pk, "dni": familiar.dni,
                     "sexo": familiar.sexo, "id_vinculo": self.vinculo.pk}
                    for familiar in adolescente.familiares.all()
                ],
            }
            for adolescente in adolescentes
        ]}

    def _validar(self, solicitud, datos):
        serializer = SolicitudValidateSerializer(data=datos)
        serializer.is_valid(raise_exception=True)
        return validar_solicitud(solicitud, serializer.validated_data)

    def _datos_creacion(self):
        adolescente = {
            "id_temp": "primero",
            "nombre": "Nombre", "apellido": "Apellido", "dni": "50000001",
            "sexo": "M", "fecha_nacimiento": "2008-02-18",
            "domicilio": self._domicilio_input(),
            "familiares": [{"nombre": "Referente", "apellido": "Uno"}],
            "referencias_instituciones_data": [
                {"id": self.referencia.pk},
                {
                    "id_temp": "referencia-compartida",
                    "nombre": "Nueva referencia",
                    "id_tipo": self.tipo.pk,
                    "domicilio": self._domicilio_input(),
                },
            ],
        }
        segundo = deepcopy(adolescente)
        segundo.update(id_temp="segundo", dni="50000002", familiares=[])
        segundo["referencias_instituciones_data"] = [{
            "id_temp": "referencia-compartida",
            "nombre": "Nueva referencia", "id_tipo": self.tipo.pk,
            "domicilio": self._domicilio_input(),
        }]
        return {
            "id_motivo": self.motivo.pk, "correo": "prueba@example.test",
            "telefono": "123456", "descripcion": "Solicitud anidada",
            "id_institucion": self.institucion.pk,
            "adolescentes": [adolescente, segundo],
            "relaciones_adolescentes": [{
                "id_temp1": "primero", "id_temp2": "segundo",
                "id_vinculo": self.vinculo_adolescente.pk,
            }],
        }

    def test_creacion_asocia_solicitante_referencias_familiares_y_relaciones_por_adolescente(self):
        serializer = SolicitudCreateSerializer(data=self._datos_creacion())
        serializer.is_valid(raise_exception=True)
        with self.captureOnCommitCallbacks(execute=True):
            solicitud = crear_solicitud(serializer.validated_data)

        primero, segundo = solicitud.adolescentes.order_by("id")
        self.assertEqual(solicitud.institucion_id, self.institucion.pk)
        referencias_primero = list(
            primero.referencias_instituciones.order_by("institucion_id")
        )
        referencias_segundo = list(
            segundo.referencias_instituciones.order_by("institucion_id")
        )
        self.assertEqual(len(referencias_primero), 2)
        self.assertEqual(len(referencias_segundo), 1)
        self.assertEqual(referencias_primero[0].institucion_id, self.referencia.pk)
        self.assertEqual(
            referencias_primero[1].institucion_id,
            referencias_segundo[0].institucion_id,
        )
        self.assertEqual(
            Institucion.objects.get(pk=referencias_segundo[0].institucion_id).nombre,
            "Nueva referencia",
        )
        self.assertEqual(
            AdolescenteInstitucion.objects.filter(adolescente__solicitud=solicitud).count(),
            3,
        )
        familiar = Familiar.objects.get(solicitud=solicitud)
        self.assertEqual(familiar.adolescente_id, primero.pk)
        self.assertIsNone(familiar.dni)
        self.assertEqual(segundo.familiares.count(), 0)

        relacion = RelacionAdolescente.objects.get()
        self.assertEqual((relacion.adolescente1_id, relacion.adolescente2_id), (primero.pk, segundo.pk))
        self.assertEqual(relacion.vinculo_id, self.vinculo_adolescente.pk)
        self.correo.assert_called_once()
        self.red.assert_not_called()

    def test_creacion_rechaza_referencias_temporales_invalidas_y_campos_globales(self):
        base = self._datos_creacion()
        casos = []
        repetido = deepcopy(base)
        repetido["adolescentes"][1]["id_temp"] = "primero"
        casos.append(repetido)
        for otro_id in ("desconocido", "primero"):
            invalido = deepcopy(base)
            invalido["relaciones_adolescentes"][0]["id_temp2"] = otro_id
            casos.append(invalido)
        repetida = deepcopy(base)
        repetida["relaciones_adolescentes"] *= 2
        casos.append(repetida)
        for campo in ("familiares", "referencias_instituciones_data"):
            obsoleto = deepcopy(base)
            obsoleto[campo] = []
            casos.append(obsoleto)

        for datos in casos:
            with self.subTest(datos=datos):
                with self.assertRaises(ValidationError):
                    SolicitudCreateSerializer(data=datos).is_valid(raise_exception=True)

    def test_valida_ciudadano_reutiliza_familiar_y_comparte_carpeta(self):
        solicitud = self._solicitud()
        primero = self._adolescente(solicitud, "50000001")
        segundo = self._adolescente(solicitud, "50000002")
        familiar1, familiar2 = self._familiar(primero), self._familiar(segundo)
        datos = self._datos_validacion([primero, segundo])
        datos["adolescentes"][0]["legajo"] = {"id_insert": 701, "carpeta_id": 801}
        familiar_data = datos["adolescentes"][1]["familiares"][0]
        familiar_data["vinculo"] = familiar_data.pop("id_vinculo")

        with self.captureOnCommitCallbacks(execute=True):
            self._validar(solicitud, datos)

        for registro in (solicitud, primero, segundo, familiar1, familiar2):
            registro.refresh_from_db()
        self.assertTrue(solicitud.validado)
        self.assertEqual(solicitud.equipo_id, 2)
        self.assertEqual(Persona.objects.count(), 3)
        self.assertEqual(familiar1.persona_id, familiar2.persona_id)
        self.assertIsNone(familiar1.persona.legajo_id)
        self.assertEqual(primero.persona.nombre, "Nombre verificado")
        self.assertEqual(primero.persona.fecha_nacimiento, date(2008, 2, 18))
        self.assertEqual(primero.persona.legajo.carpeta_id, segundo.persona.legajo.carpeta_id)
        self.assertEqual((primero.persona.legajo.id_insert, primero.persona.legajo.letra), (701, "A"))
        self.assertEqual((primero.persona.legajo.carpeta.id_insert, primero.persona.legajo.carpeta.letra), (801, "A"))
        self.assertEqual(segundo.persona.legajo.letra, "B")
        self.assertEqual(Relacion.objects.filter(persona_2=familiar1.persona).count(), 2)
        self.assertEqual(PersonaDomicilio.objects.count(), 2)
        self.assertEqual(self.ciudadano.call_count, 3)
        self.correo.assert_called_once()

    def test_sin_datos_externos_crea_legajo_y_carpeta_locales(self):
        solicitud = self._solicitud()
        primero = self._adolescente(solicitud, "50000001")
        segundo = self._adolescente(solicitud, "50000002")
        self._validar(solicitud, self._datos_validacion([primero, segundo]))
        self.assertEqual(Carpeta.objects.count(), 1)
        self.assertEqual(Carpeta.objects.get().letra, "B")
        self.assertEqual(Legajo.objects.count(), 2)
        self.assertEqual(set(Legajo.objects.values_list("letra", flat=True)), {"B"})

    def test_persona_existente_conserva_salud_no_enviada_y_guarda_cambios(self):
        solicitud = self._solicitud()
        adolescente = self._adolescente(solicitud, "50000001")
        persona = self._persona("50000001", hcf=101, discapacidades=True, consumos_problematicos=True)
        datos = self._datos_validacion([adolescente])
        datos["adolescentes"][0]["salud"] = {"consumos_problematicos": False}
        self._validar(solicitud, datos)
        persona.refresh_from_db()
        adolescente.refresh_from_db()
        self.assertEqual(adolescente.persona_id, persona.pk)
        self.assertTrue(persona.discapacidades)
        self.assertFalse(persona.consumos_problematicos)
        self.assertEqual(persona.hcf, 101)
        self.ciudadano.assert_not_called()

    def test_ciudadano_ausente_revierte_personas_y_asociaciones_previas(self):
        solicitud = self._solicitud()
        adolescente = self._adolescente(solicitud, "50000001")
        familiar = self._familiar(adolescente)
        self.ciudadano.side_effect = [self._ciudadano(adolescente.dni, adolescente.sexo), None]
        with self.captureOnCommitCallbacks(execute=True):
            with self.assertRaises(ValidationError):
                self._validar(solicitud, self._datos_validacion([adolescente]))
        for registro in (solicitud, adolescente, familiar):
            registro.refresh_from_db()
        self.assertFalse(solicitud.validado)
        self.assertIsNone(adolescente.persona_id)
        self.assertIsNone(familiar.persona_id)
        self.assertEqual(Persona.objects.count(), 0)
        self.assertEqual(PersonaDomicilio.objects.count(), 0)
        self.assertEqual(Relacion.objects.count(), 0)
        self.assertEqual(Legajo.objects.count(), 0)
        self.correo.assert_not_called()

    def test_conflicto_de_carpetas_revierte_toda_la_validacion(self):
        solicitud = self._solicitud()
        adolescentes = [self._adolescente(solicitud, str(50000001 + i)) for i in range(3)]
        existentes = []
        for indice, adolescente in enumerate(adolescentes[1:], start=1):
            carpeta = Carpeta.objects.create(id_insert=indice, letra="A")
            legajo = Legajo.objects.create(id_insert=indice, carpeta=carpeta, letra="A")
            existentes.append(self._persona(adolescente.dni, legajo=legajo))
        datos = self._datos_validacion(adolescentes)
        datos["adolescentes"][1]["salud"] = {"violencias": True}
        with self.captureOnCommitCallbacks(execute=True):
            with self.assertRaises(ValidationError):
                self._validar(solicitud, datos)
        solicitud.refresh_from_db()
        self.assertFalse(solicitud.validado)
        self.assertEqual(solicitud.equipo_id, 1)
        self.assertEqual(Persona.objects.count(), 2)
        self.assertEqual(Carpeta.objects.count(), 2)
        self.assertEqual(Legajo.objects.count(), 2)
        self.assertFalse(solicitud.adolescentes.filter(persona__isnull=False).exists())
        for persona in existentes:
            persona.refresh_from_db()
            self.assertFalse(persona.violencias)
        self.correo.assert_not_called()

    def test_validacion_rechaza_adolescentes_faltantes_duplicados_o_ajenos(self):
        solicitud = self._solicitud()
        primero = self._adolescente(solicitud, "50000001")
        segundo = self._adolescente(solicitud, "50000002")
        ajeno = self._adolescente(self._solicitud(), "50000003")
        for adolescentes in ([primero], [primero, primero], [primero, ajeno]):
            with self.subTest(ids=[item.pk for item in adolescentes]):
                with self.assertRaises(ValidationError):
                    self._validar(solicitud, self._datos_validacion(adolescentes))
                self.assertEqual(Persona.objects.count(), 0)
                solicitud.refresh_from_db()
                self.assertFalse(solicitud.validado)
        self.assertIsNone(segundo.persona_id)

    def test_validacion_rechaza_familiares_faltantes_duplicados_o_ajenos(self):
        solicitud = self._solicitud()
        primero = self._adolescente(solicitud, "50000001")
        segundo = self._adolescente(solicitud, "50000002")
        self._familiar(primero)
        otro_familiar = self._familiar(segundo, "30000002")
        ajeno = self._familiar(self._adolescente(self._solicitud(), "50000003"), "30000003")
        base = self._datos_validacion([primero, segundo])
        casos = []
        faltante = deepcopy(base)
        faltante["adolescentes"][0]["familiares"] = []
        casos.append(faltante)
        repetido = deepcopy(base)
        repetido["adolescentes"][0]["familiares"] *= 2
        casos.append(repetido)
        identidad_repetida = deepcopy(base)
        nueva = deepcopy(identidad_repetida["adolescentes"][0]["familiares"][0])
        nueva.pop("id")
        identidad_repetida["adolescentes"][0]["familiares"].append(nueva)
        casos.append(identidad_repetida)
        for familiar in (otro_familiar, ajeno):
            asociacion_invalida = deepcopy(base)
            asociacion_invalida["adolescentes"][0]["familiares"][0]["id"] = familiar.pk
            casos.append(asociacion_invalida)
        for datos in casos:
            with self.subTest(datos=datos):
                with self.assertRaises(ValidationError):
                    self._validar(solicitud, datos)
                self.assertEqual(Persona.objects.count(), 0)
                self.assertEqual(Relacion.objects.count(), 0)
                solicitud.refresh_from_db()
                self.assertFalse(solicitud.validado)

    def test_familiar_existente_se_reutiliza_sin_consultar_ciudadano(self):
        solicitud = self._solicitud()
        adolescente = self._adolescente(solicitud, "50000001")
        familiar = self._familiar(adolescente)
        self._persona(adolescente.dni)
        persona_familiar = self._persona(familiar.dni, sexo=familiar.sexo, discapacidades=True)
        self._validar(solicitud, self._datos_validacion([adolescente]))
        familiar.refresh_from_db()
        self.assertEqual(familiar.persona_id, persona_familiar.pk)
        self.assertTrue(familiar.persona.discapacidades)
        self.assertIsNone(familiar.persona.legajo_id)
        self.assertEqual(Relacion.objects.get().persona_2_id, persona_familiar.pk)
        self.ciudadano.assert_not_called()

    def test_familiar_nuevo_sin_id_se_relaciona_solo_con_su_adolescente(self):
        solicitud = self._solicitud()
        primero = self._adolescente(solicitud, "50000001")
        segundo = self._adolescente(solicitud, "50000002")
        datos = self._datos_validacion([primero, segundo])
        datos["adolescentes"][0]["familiares"] = [{
            "dni": "30000001", "sexo": "F", "id_vinculo": self.vinculo.pk,
        }]
        self._validar(solicitud, datos)
        primero.refresh_from_db()
        segundo.refresh_from_db()
        familiar = Persona.objects.get(dni="30000001", sexo="F")
        relacion = Relacion.objects.get()
        self.assertEqual(relacion.persona_1_id, primero.persona_id)
        self.assertEqual(relacion.persona_2_id, familiar.pk)
        self.assertEqual(relacion.vinculo_id, self.vinculo.pk)
        self.assertFalse(Relacion.objects.filter(persona_1=segundo.persona).exists())
        self.assertIsNone(familiar.legajo_id)

    def test_conserva_vinculos_historicos_y_no_duplica_relacion_invertida(self):
        solicitud = self._solicitud()
        adolescente = self._adolescente(solicitud, "50000001")
        familiar = self._familiar(adolescente)
        persona_adolescente = self._persona(adolescente.dni)
        persona_familiar = self._persona(familiar.dni, sexo=familiar.sexo)
        otro_vinculo = Vinculo.objects.create(nombre="Otro vínculo", adolescente=False)
        Relacion.objects.create(
            persona_1=persona_adolescente, persona_2=persona_familiar, vinculo=otro_vinculo,
        )
        Relacion.objects.create(
            persona_1=persona_familiar, persona_2=persona_adolescente, vinculo=self.vinculo,
        )
        self._validar(solicitud, self._datos_validacion([adolescente]))
        self.assertEqual(Relacion.objects.count(), 2)
        self.assertTrue(Relacion.objects.filter(vinculo=otro_vinculo).exists())

    def test_vistas_crean_y_validan_con_el_nuevo_contrato(self):
        factory = APIRequestFactory()
        datos = self._datos_creacion()
        request = factory.post("/api/solicitud/solicitud/", datos, format="json")
        response = SolicitudViewSet.as_view({"post": "create"})(request)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(len(response.data["relaciones_adolescentes"]), 1)
        self.assertEqual(len(response.data["adolescentes"][0]["familiares"]), 1)
        solicitud = Solicitud.objects.get(pk=response.data["id"])
        adolescentes = list(solicitud.adolescentes.order_by("id"))
        validacion = self._datos_validacion(adolescentes)
        validacion["adolescentes"][0]["familiares"][0].update(dni="30000001", sexo="F")
        request = factory.put("/api/solicitud/solicitud/validar/", validacion, format="json")
        force_authenticate(request, user=SimpleNamespace(
            is_authenticated=True, is_superuser=True, equipo=self.entrada, equipo_id=self.entrada.pk,
        ))
        response = SolicitudViewSet.as_view({"put": "validar"})(request, pk=solicitud.pk)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data["validado"])
        self.assertEqual(len(response.data["familiares_validados"]), 1)
        self.assertIsNotNone(response.data["adolescentes"][0]["persona"]["legajo"])

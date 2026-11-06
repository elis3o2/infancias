from datetime import date
from unittest.mock import patch

from django.apps import apps
from django.db import connection
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from rest_framework.test import APIClient

from src.apps.domicilio.models import Departamento, Domicilio, Provincia
from src.apps.persona.models import (
    Adolescente, Carpeta, Familiar, Legajo, Persona, PersonaDomicilio,
    PersonaTelefono, Relacion, RelacionAdolescente, Vinculo,
)
from src.apps.solicitud.admision import agregar_adolescente, agregar_familiar
from src.apps.solicitud.models import MotivoSolicitud, Solicitud
from src.models import Equipo, Usuario


@override_settings(ROOT_URLCONF="src.apps.solicitud.urls")
class SolicitudAdmisionTests(TestCase):
    @classmethod
    def setUpClass(cls):
        if connection.vendor != "sqlite" or "memory" not in connection.settings_dict["NAME"]:
            raise RuntimeError("Estas pruebas requieren SQLite en memoria, sin archivos .db.")
        cls.modelos_externos = [modelo for modelo in apps.get_models() if not modelo._meta.managed]
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
        red = patch("requests.sessions.Session.request", side_effect=AssertionError("HTTP real prohibido"))
        self.red = red.start()
        self.addCleanup(red.stop)
        self.entrada = Equipo.objects.create(id=1, nombre="Entrada")
        self.admision = Equipo.objects.create(id=2, nombre="Admisión")
        self.territorial = Equipo.objects.create(id=3, nombre="Territorial")
        self.usuario = Usuario.objects.create(username="admision", equipo=self.admision)
        self.client = APIClient()
        self.client.force_authenticate(self.usuario)
        motivo = MotivoSolicitud.objects.create(nombre="Consulta")
        self.solicitud = Solicitud.objects.create(
            motivo=motivo, correo="", telefono="", descripcion="Solicitud de prueba",
            fecha_hora_creacion=timezone.now(), validado=True, rechazado=False, equipo=self.admision,
        )
        provincia = Provincia.objects.create(nombre="Santa Fe")
        self.departamento = Departamento.objects.create(nombre="Rosario", provincia=provincia)
        domicilio = Domicilio.objects.create(nombre="Domicilio", departamento=self.departamento)
        self.carpeta = Carpeta.objects.create(letra="B")
        self.legajo = Legajo.objects.create(carpeta=self.carpeta, letra="B")
        self.persona = self._persona("50000001", legajo=self.legajo)
        self.adolescente = Adolescente.objects.create(
            solicitud=self.solicitud, persona=self.persona, domicilio=domicilio,
            **self._identidad("50000001"),
        )
        self.familiar_vinculo = Vinculo.objects.create(nombre="Referente", adolescente=False)
        self.adolescente_vinculo = Vinculo.objects.create(nombre="Hermano", adolescente=True)
        self.url = f"/solicitud/{self.solicitud.pk}/"

    @staticmethod
    def _identidad(dni):
        return {"dni": dni, "sexo": "M", "nombre": "Nombre", "apellido": "Prueba", "fecha_nacimiento": "2008-01-02"}

    def _persona(self, dni, **extras):
        return Persona.objects.create(
            **self._identidad(dni), discapacidades=False, consumos_problematicos=False,
            intentos_de_suicidio=False, problemas_socioambientales=False, violencias=False, **extras,
        )

    def _datos(self, tipo="familiares", dni="50000002"):
        return {
            "id_adolescente": self.adolescente.pk,
            "persona": {**self._identidad(dni), "hc": 123, "hcf": 456, "discapacidades": True},
            "id_vinculo": (self.familiar_vinculo if tipo == "familiares" else self.adolescente_vinculo).pk,
            "telefono": "3411234567",
            "domicilio": {"nombre": "Nuevo domicilio", "id_departamento": self.departamento.pk},
        }

    def _post(self, tipo="familiares", datos=None):
        return self.client.post(f"{self.url}{tipo}/", datos if datos is not None else self._datos(tipo), format="json")

    def _cantidades(self):
        return {modelo.__name__: modelo.objects.count() for modelo in (
            Adolescente, Familiar, Persona, Domicilio, PersonaDomicilio, PersonaTelefono,
            Relacion, RelacionAdolescente, Carpeta, Legajo,
        )}

    def test_agrega_familiar_con_persona_salud_contacto_y_relacion(self):
        respuesta = self._post()
        self.assertEqual(respuesta.status_code, 201, respuesta.data)
        familiar = Familiar.objects.get()
        self.assertEqual(familiar.solicitud_id, self.solicitud.pk)
        self.assertEqual(familiar.adolescente_id, self.adolescente.pk)
        self.assertEqual(familiar.persona.fecha_nacimiento, date(2008, 1, 2))
        self.assertEqual((familiar.persona.hc, familiar.persona.hcf), (123, 456))
        self.assertTrue(familiar.persona.discapacidades)
        self.assertIsNone(familiar.persona.legajo_id)
        self.assertEqual(Relacion.objects.get().persona_1_id, self.persona.pk)
        self.assertEqual(Relacion.objects.get().persona_2_id, familiar.persona_id)
        self.assertEqual(PersonaTelefono.objects.get().telefono, "3411234567")
        self.assertEqual(PersonaDomicilio.objects.get().domicilio_id, familiar.domicilio_id)
        self.assertTrue(respuesta.data["puede_agregar_personas"])
        recargada = self.client.get(self.url)
        self.assertEqual(recargada.data["adolescentes"][0]["familiares"][0]["id"], familiar.pk)
        self.assertEqual(recargada.data["familiares_validados"][0]["id"], familiar.persona_id)
        self.red.assert_not_called()

    def test_lista_y_reporte_muestran_legajos_automaticos_o_manuales_sin_modificarlos(self):
        from src.apps.solicitud.reportes_serializers import SolicitudReporteSerializer
        from src.apps.persona.services import _serializar_persona_consulta

        for numero in (None, 900):
            self.legajo.id_insert = numero
            self.legajo.save(update_fields=["id_insert"])
            self.carpeta.id_insert = numero
            self.carpeta.save(update_fields=["id_insert"])
            for equipo in (self.admision, self.territorial):
                self.solicitud.equipo = equipo
                self.solicitud.save(update_fields=["equipo"])
                self.usuario.equipo = equipo
                self.usuario.save(update_fields=["equipo"])
                antes = self._cantidades()
                registro = {"id_adolescente": self.adolescente.pk, "nombre": "Nombre Prueba",
                            "legajo": numero or self.legajo.pk, "carpeta": numero or self.carpeta.pk}
                listado = self.client.get("/solicitud/")
                self.assertEqual(listado.status_code, 200, listado.data)
                self.assertEqual(listado.data[0]["legajos"], [registro])
                detalle = self.client.get(self.url)
                self.assertEqual(detalle.status_code, 200, detalle.data)
                self.assertEqual(detalle.data["adolescentes"][0]["persona"]["legajo"]["id"], self.legajo.pk)
                self.assertEqual(SolicitudReporteSerializer(self.solicitud).data["legajos"], [registro])
                consulta = _serializar_persona_consulta(Persona.objects.select_related("legajo__carpeta").get(pk=self.persona.pk))
                self.assertEqual(consulta["legajo"], registro["legajo"])
                self.assertEqual(consulta["carpeta"], registro["carpeta"])
                self.assertEqual(self._cantidades(), antes)

    def test_no_se_pueden_editar_legajo_o_carpeta_despues_de_entrada(self):
        for equipo in (self.admision, self.territorial):
            self.usuario.equipo = equipo
            self.usuario.save(update_fields=["equipo"])
            self.solicitud.equipo = equipo
            self.solicitud.save(update_fields=["equipo"])
            for metodo in (self.client.patch, self.client.put):
                respuesta = metodo(self.url, {"legajo": {"id_insert": 999, "carpeta_id": 999}}, format="json")
                self.assertIn(respuesta.status_code, (403, 405))
        self.legajo.refresh_from_db()
        self.assertIsNone(self.legajo.id_insert)
        self.assertEqual(self.legajo.carpeta_id, self.carpeta.pk)

    def test_listado_cambia_problematica_por_nombre_de_persona_al_derivar(self):
        self.adolescente.nombre = "Nombre declarado"
        self.adolescente.apellido = "Original"
        self.adolescente.save(update_fields=["nombre", "apellido"])
        self.persona.nombre = "Nombre validado"
        self.persona.apellido = "Correcto"
        self.persona.save(update_fields=["nombre", "apellido"])
        listado = self.client.get("/solicitud/")
        self.assertEqual(listado.status_code, 200, listado.data)
        self.assertEqual(listado.data[0]["titulo"], "Consulta")
        derivacion = self.client.put(f"{self.url}derivar/", {"equipo_id": self.territorial.pk}, format="json")
        self.assertEqual(derivacion.status_code, 200, derivacion.data)
        territorial = Usuario.objects.create(username="territorial-listado", equipo=self.territorial)
        self.client.force_authenticate(territorial)
        listado = self.client.get("/solicitud/")
        self.assertEqual(listado.status_code, 200, listado.data)
        self.assertEqual(listado.data[0]["titulo"], "Nombre validado Correcto (DNI: 50000001)")
        self.assertNotIn("Nombre declarado", listado.data[0]["titulo"])
        self.assertNotIn("Consulta", listado.data[0]["titulo"])

    def test_titulo_derivado_incluye_todos_los_ninos_y_tolera_registros_sin_persona(self):
        from src.apps.solicitud.serializers import SolicitudListSerializer

        Adolescente.objects.create(solicitud=self.solicitud, nombre="Otra niña", apellido="Apellido", sexo="F",
            dni="50000009", fecha_nacimiento=date(2012, 1, 1))
        self.solicitud.fecha_hora_admision = timezone.now()
        self.solicitud.save(update_fields=["fecha_hora_admision"])
        datos = SolicitudListSerializer(self.solicitud).data
        self.assertIn("Nombre Prueba (DNI: 50000001)", datos["titulo"])
        self.assertIn("Otra niña Apellido (DNI: 50000009)", datos["titulo"])

    def test_titulo_usa_dni_validado_y_no_el_declarado(self):
        from src.apps.solicitud.serializers import SolicitudListSerializer

        self.adolescente.dni = "50000099"
        self.adolescente.save(update_fields=["dni"])
        self.solicitud.fecha_hora_admision = timezone.now()
        titulo = SolicitudListSerializer(self.solicitud).data["titulo"]
        self.assertIn("DNI: 50000001", titulo)
        self.assertNotIn("50000099", titulo)

    def test_titulo_sin_dni_conserva_nombre_sin_valores_vacios(self):
        from src.apps.solicitud.serializers import SolicitudListSerializer

        self.persona.dni = ""
        self.persona.save(update_fields=["dni"])
        self.solicitud.fecha_hora_admision = timezone.now()
        self.assertEqual(SolicitudListSerializer(self.solicitud).data["titulo"], "Nombre Prueba")

    def test_derivada_sin_ninos_no_vuelve_a_mostrar_la_problematica(self):
        from src.apps.solicitud.serializers import SolicitudListSerializer

        solicitud = Solicitud.objects.create(motivo=self.solicitud.motivo, equipo=self.territorial,
            correo="", telefono="", validado=True, rechazado=False,
            fecha_hora_creacion=timezone.now(), fecha_hora_admision=timezone.now())
        self.assertEqual(SolicitudListSerializer(solicitud).data["titulo"], f"Solicitud #{solicitud.pk}")

    def test_reutiliza_persona_y_relacion_sin_quitar_legajo(self):
        persona = self._persona("50000002", legajo=Legajo.objects.create(carpeta=self.carpeta, letra="B"))
        Relacion.objects.create(persona_1=persona, persona_2=self.persona, vinculo=self.familiar_vinculo)
        respuesta = self._post()
        self.assertEqual(respuesta.status_code, 201, respuesta.data)
        self.assertEqual(Familiar.objects.get().persona_id, persona.pk)
        self.assertEqual(Persona.objects.count(), 2)
        self.assertEqual(Relacion.objects.count(), 1)
        persona.refresh_from_db()
        self.assertIsNotNone(persona.legajo_id)

    def test_rechaza_familiar_duplicado_pero_permite_vincularlo_a_otro_adolescente(self):
        self.assertEqual(self._post().status_code, 201)
        antes = self._cantidades()
        self.assertEqual(self._post().status_code, 400)
        self.assertEqual(self._cantidades(), antes)
        respuesta = self._post("adolescentes", self._datos("adolescentes", "50000003"))
        self.assertEqual(respuesta.status_code, 201, respuesta.data)
        datos = self._datos()
        datos["id_adolescente"] = Adolescente.objects.get(dni="50000003").pk
        self.assertEqual(self._post(datos=datos).status_code, 201)
        self.assertEqual(Familiar.objects.count(), 2)
        self.assertEqual(Persona.objects.filter(dni="50000002").count(), 1)

    def test_rechaza_ser_su_propio_familiar_sin_modificar_salud(self):
        antes = self._cantidades()
        respuesta = self._post(datos=self._datos(dni=self.persona.dni))
        self.assertEqual(respuesta.status_code, 400)
        self.assertEqual(self._cantidades(), antes)
        self.persona.refresh_from_db()
        self.assertFalse(self.persona.discapacidades)

    def test_agrega_adolescente_con_vinculo_y_legajo_en_la_misma_carpeta(self):
        respuesta = self._post("adolescentes")
        self.assertEqual(respuesta.status_code, 201, respuesta.data)
        nuevo = Adolescente.objects.get(dni="50000002")
        self.assertIsNotNone(nuevo.persona_id)
        self.assertEqual(nuevo.persona.legajo.carpeta_id, self.carpeta.pk)
        self.assertNotEqual(nuevo.persona.legajo_id, self.legajo.pk)
        self.assertEqual(nuevo.persona.legajo.letra, "B")
        relacion = RelacionAdolescente.objects.get()
        self.assertEqual((relacion.adolescente1_id, relacion.adolescente2_id), (self.adolescente.pk, nuevo.pk))
        self.assertEqual(len(respuesta.data["adolescentes"]), 2)
        self.assertEqual(len(respuesta.data["relaciones_adolescentes"]), 1)
        self.solicitud.refresh_from_db()
        self.assertTrue(self.solicitud.validado)
        self.assertEqual(self.solicitud.equipo_id, self.admision.pk)
        self.assertEqual(self.client.get(self.url).data["adolescentes"][1]["persona"]["hc"], 123)
        self.red.assert_not_called()

    def test_reutiliza_legajo_existente_de_la_misma_carpeta(self):
        legajo = Legajo.objects.create(carpeta=self.carpeta, letra="B")
        persona = self._persona("50000002", legajo=legajo)
        respuesta = self._post("adolescentes")
        self.assertEqual(respuesta.status_code, 201, respuesta.data)
        nuevo = Adolescente.objects.get(dni="50000002")
        self.assertEqual(nuevo.persona_id, persona.pk)
        self.assertEqual(nuevo.persona.legajo_id, legajo.pk)
        self.assertEqual(Legajo.objects.count(), 2)

    def test_conflicto_carpeta_revierte_toda_el_alta_y_salud(self):
        carpeta = Carpeta.objects.create(letra="A", id_insert=900)
        persona = self._persona("50000002", legajo=Legajo.objects.create(carpeta=carpeta, letra="B"))
        antes = self._cantidades()
        respuesta = self._post("adolescentes")
        self.assertEqual(respuesta.status_code, 400, respuesta.data)
        self.assertIn("carpetas distintas", str(respuesta.data))
        self.assertEqual(self._cantidades(), antes)
        persona.refresh_from_db()
        self.assertFalse(persona.discapacidades)
        self.assertEqual(persona.legajo.carpeta_id, carpeta.pk)

    def test_legajo_externo_compartido_y_conflicto_de_carpeta_ingresada(self):
        datos = self._datos("adolescentes")
        datos["legajo"] = {"id_insert": 200, "carpeta_id": 900}
        antes = self._cantidades()
        self.assertEqual(self._post("adolescentes", datos).status_code, 400)
        self.assertEqual(self._cantidades(), antes)
        datos["legajo"] = {"id_insert": 200}
        respuesta = self._post("adolescentes", datos)
        self.assertEqual(respuesta.status_code, 201, respuesta.data)
        legajo = Persona.objects.get(dni="50000002").legajo
        self.assertEqual((legajo.id_insert, legajo.letra, legajo.carpeta_id), (200, "A", self.carpeta.pk))

    def test_no_admite_adolescente_duplicado(self):
        antes = self._cantidades()
        respuesta = self._post("adolescentes", self._datos("adolescentes", self.persona.dni))
        self.assertEqual(respuesta.status_code, 400)
        self.assertEqual(self._cantidades(), antes)

    def test_valida_domicilio_identidad_y_tipo_de_vinculo(self):
        antes = self._cantidades()
        for tipo in ("familiares", "adolescentes"):
            for campo in ("persona", "id_adolescente", "id_vinculo"):
                datos = self._datos(tipo)
                del datos[campo]
                self.assertEqual(self._post(tipo, datos).status_code, 400)
            datos = self._datos(tipo)
            datos["id_vinculo"] = (self.adolescente_vinculo if tipo == "familiares" else self.familiar_vinculo).pk
            self.assertEqual(self._post(tipo, datos).status_code, 400)
        datos = self._datos("adolescentes")
        del datos["domicilio"]
        self.assertEqual(self._post("adolescentes", datos).status_code, 400)
        self.assertEqual(self._cantidades(), antes)

    def test_no_admite_adolescente_ajeno_o_sin_validar(self):
        antes = self._cantidades()
        for tipo in ("familiares", "adolescentes"):
            datos = self._datos(tipo)
            datos["id_adolescente"] = 9999
            self.assertEqual(self._post(tipo, datos).status_code, 400)
        self.adolescente.persona = None
        self.adolescente.save(update_fields=["persona"])
        for tipo in ("familiares", "adolescentes"):
            self.assertEqual(self._post(tipo).status_code, 400)
        self.assertEqual(self._cantidades(), antes)

    def test_rechaza_adolescente_existente_de_otra_solicitud(self):
        otra = Solicitud.objects.create(
            motivo=self.solicitud.motivo, correo="", telefono="", descripcion="Otra solicitud",
            fecha_hora_creacion=timezone.now(), validado=True, rechazado=False, equipo=self.admision,
        )
        ajeno = Adolescente.objects.create(solicitud=otra, persona=self.persona, **self._identidad(self.persona.dni))
        antes = self._cantidades()
        for tipo in ("familiares", "adolescentes"):
            datos = self._datos(tipo)
            datos["id_adolescente"] = ajeno.pk
            self.assertEqual(self._post(tipo, datos).status_code, 400)
        self.assertEqual(self._cantidades(), antes)

    def test_territorial_y_anonimos_no_pueden_agregar(self):
        for equipo in (self.territorial,):
            usuario = Usuario.objects.create(username=f"usuario{equipo.pk}", equipo=equipo)
            self.client.force_authenticate(usuario)
            for tipo in ("familiares", "adolescentes"):
                self.assertEqual(self._post(tipo).status_code, 403)
        self.client = APIClient()
        for tipo in ("familiares", "adolescentes"):
            self.assertIn(self._post(tipo).status_code, (401, 403))
        self.assertEqual(Persona.objects.count(), 1)

    def test_pendiente_rechazada_no_admite_altas_y_derivada_solo_familiares(self):
        for cambios in ({"validado": False}, {"validado": True, "rechazado": True}):
            Solicitud.objects.filter(pk=self.solicitud.pk).update(**cambios)
            for tipo in ("familiares", "adolescentes"):
                self.assertIn(self._post(tipo).status_code, (403, 404))
        Solicitud.objects.filter(pk=self.solicitud.pk).update(rechazado=False, equipo=self.territorial)
        self.assertEqual(self._post().status_code, 201)
        self.assertIn(self._post("adolescentes").status_code, (403, 404))
        self.usuario.equipo = self.territorial
        self.usuario.save(update_fields=["equipo"])
        self.assertFalse(self.client.get(self.url).data["puede_agregar_personas"])
        self.assertFalse(self.client.get(self.url).data["puede_agregar_familiares"])

    def test_servicio_revisa_estado_actual_aunque_reciba_instancia_anterior(self):
        Solicitud.objects.filter(pk=self.solicitud.pk).update(equipo=self.territorial)
        with self.assertRaises(PermissionDenied):
            agregar_adolescente(self.solicitud, self.usuario, {})
        Solicitud.objects.filter(pk=self.solicitud.pk).update(rechazado=True)
        for servicio in (agregar_adolescente, agregar_familiar):
            with self.assertRaises(PermissionDenied):
                servicio(self.solicitud, self.usuario, {})

    def test_entrada_y_admision_agregan_familiares_en_cualquier_equipo_sin_derivar(self):
        entrada = Usuario.objects.create(username="entrada-familiares", equipo=self.entrada)
        for indice, usuario in enumerate((entrada, self.usuario)):
            self.client.force_authenticate(usuario)
            for equipo in (self.entrada, self.admision, self.territorial):
                with self.subTest(usuario=usuario.username, equipo=equipo.pk):
                    Solicitud.objects.filter(pk=self.solicitud.pk).update(equipo=equipo)
                    detalle = self.client.get(self.url)
                    self.assertEqual(detalle.status_code, 200, detalle.data)
                    self.assertTrue(detalle.data["puede_agregar_familiares"])
                    self.assertEqual(detalle.data["puede_comentar"], usuario == self.usuario)
                    respuesta = self._post(datos=self._datos(dni=f"600000{indice}{equipo.pk}"))
                    self.assertEqual(respuesta.status_code, 201, respuesta.data)
                    self.solicitud.refresh_from_db()
                    self.assertEqual(self.solicitud.equipo_id, equipo.pk)
                    self.assertTrue(self.solicitud.validado)
                    self.assertIsNone(self.solicitud.fecha_hora_admision)
                    self.assertIsNone(self.solicitud.fecha_hora_entrada)
                    if usuario == entrada:
                        self.assertFalse(respuesta.data["puede_agregar_personas"])
                        self.assertEqual(self._post("adolescentes").status_code, 403)
        self.assertEqual(Familiar.objects.count(), 6)
        self.assertEqual(Relacion.objects.count(), 6)
        self.red.assert_not_called()

    def test_entrada_no_agrega_familiares_a_rechazadas_o_pendientes(self):
        entrada = Usuario.objects.create(username="entrada-denegada", equipo=self.entrada)
        self.client.force_authenticate(entrada)
        antes = self._cantidades()
        for equipo in (self.entrada, self.admision, self.territorial):
            for validado, rechazado in ((False, False), (True, True)):
                Solicitud.objects.filter(pk=self.solicitud.pk).update(equipo=equipo, validado=validado, rechazado=rechazado)
                self.assertIn(self._post().status_code, (403, 404))
                with self.assertRaises(PermissionDenied):
                    agregar_familiar(self.solicitud, entrada, {})
        self.assertEqual(self._cantidades(), antes)

from datetime import date, timedelta
from unittest.mock import patch

from django.apps import apps
from django.db import connection
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from src.apps.persona.models import Adolescente, Carpeta, Legajo, Persona
from src.apps.solicitud.models import MotivoSolicitud, Solicitud, SolicitudComentario
from src.models import Equipo, Usuario


@override_settings(ROOT_URLCONF="src.apps.persona.urls")
class HistorialNinosTests(TestCase):
    @classmethod
    def setUpClass(cls):
        if connection.vendor != "sqlite" or "memory" not in connection.settings_dict["NAME"]:
            raise RuntimeError("Estas pruebas solo pueden usar SQLite en memoria.")
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
        red = patch("requests.sessions.Session.request", side_effect=AssertionError("No debe consultar APIs externas"))
        self.red = red.start()
        self.addCleanup(red.stop)
        self.entrada = Equipo.objects.create(id=1, nombre="Entrada")
        self.admision = Equipo.objects.create(id=2, nombre="Admisión")
        self.territorial = Equipo.objects.create(id=3, nombre="Territorial")
        self.usuario = Usuario.objects.create(username="operador", equipo=self.entrada)
        self.autor = Usuario.objects.create(username="autora", equipo=self.admision)
        self.client = APIClient()
        self.client.force_authenticate(self.usuario)
        self.motivo = MotivoSolicitud.objects.create(nombre="Consulta")
        carpeta = Carpeta.objects.create(letra="A", id_insert=900)
        self.legajo = Legajo.objects.create(carpeta=carpeta, letra="A", id_insert=1234)
        self.persona = self._persona("50000001", legajo=self.legajo)
        self.validada = self._solicitud(self.territorial, validado=True, dias=3)
        self.rechazada = self._solicitud(self.entrada, rechazado=True, dias=2)
        self.pendiente = self._solicitud(self.admision, dias=1)
        self.adolescente = self._adolescente(self.validada, persona=self.persona)
        self._adolescente(self.rechazada)
        self.reciente = self._adolescente(self.pendiente)
        self.comentario = self._comentario(self.validada, "Primera intervención\nSegunda línea", dias=2)
        self._comentario(self.pendiente, "Seguimiento reciente", dias=1)

    def _persona(self, dni, sexo="F", **cambios):
        return Persona.objects.create(
            dni=dni, sexo=sexo, nombre="Clara", apellido="Diaz", fecha_nacimiento=date(2012, 2, 18),
            discapacidades=False, consumos_problematicos=False, intentos_de_suicidio=False,
            problemas_socioambientales=False, violencias=False, **cambios,
        )

    def _solicitud(self, equipo, *, validado=False, rechazado=False, dias=0):
        return Solicitud.objects.create(
            equipo=equipo, motivo=self.motivo, correo="", telefono="", descripcion="Descripción de prueba",
            fecha_hora_creacion=timezone.now() - timedelta(days=dias), validado=validado, rechazado=rechazado,
            motivo_rechazo="Motivo de prueba" if rechazado else None,
        )

    def _adolescente(self, solicitud, dni="50000001", sexo="F", persona=None, **cambios):
        return Adolescente.objects.create(
            solicitud=solicitud, dni=dni, sexo=sexo, persona=persona,
            **{"nombre": "Nombre declarado", "apellido": "Apellido declarado", "fecha_nacimiento": date(2012, 1, 1), **cambios},
        )

    def _comentario(self, solicitud, texto, dias=0):
        fecha = timezone.now() - timedelta(days=dias)
        return SolicitudComentario.objects.create(
            solicitud=solicitud, usuario=self.autor, comentario=texto,
            fecha_hora_creacion=fecha, fecha_hora_ultmod=fecha,
        )

    def _buscar(self, **filtros):
        respuesta = self.client.get("/historial/", filtros)
        self.assertEqual(respuesta.status_code, 200, respuesta.data)
        return respuesta.data

    def test_busca_por_nombre_apellido_documento_y_numero_de_legajo(self):
        for filtros in ({"nombre": "cla", "apellido": "DIA"}, {"nombre": "Clara"},
                        {"apellido": "Diaz"}, {"dni": "50000001"}, {"legajo": 1234}):
            with self.subTest(filtros=filtros):
                datos = self._buscar(**filtros)
                self.assertEqual(datos["count"], 1)
                nino = datos["results"][0]
                self.assertEqual((nino["nombre"], nino["apellido"]), ("Clara", "Diaz"))
                self.assertEqual(nino["legajo"], 1234)
                self.assertTrue(nino["validado"])
                self.assertEqual(nino["fecha_nacimiento"], "2012-02-18")
        self.assertEqual(self._buscar(nombre="Nombre declarado")["count"], 0)
        self.assertEqual(self._buscar(nombre="Clara", dni="50000002")["count"], 0)
        self.red.assert_not_called()

    def test_historial_incluye_todos_los_estados_equipos_y_comentarios(self):
        respuesta = self.client.get(f"/historial/{self.adolescente.pk}/")
        self.assertEqual(respuesta.status_code, 200, respuesta.data)
        self.assertEqual(respuesta.data["nino"]["id"], self.reciente.pk)
        solicitudes = respuesta.data["solicitudes"]
        self.assertEqual([solicitud["id"] for solicitud in solicitudes],
                         [self.pendiente.pk, self.rechazada.pk, self.validada.pk])
        self.assertEqual(solicitudes[1]["motivo_rechazo"], "Motivo de prueba")
        comentarios = [comentario for solicitud in solicitudes for comentario in solicitud["comentarios"]]
        self.assertEqual(len(comentarios), 2)
        self.assertEqual(comentarios[-1]["usuario_nombre"], "autora")
        self.assertEqual(comentarios[-1]["comentario"], self.comentario.comentario)
        self.assertNotIn("puede_editar", comentarios[-1])
        self.red.assert_not_called()

    def test_separa_mismo_dni_con_otro_sexo_y_no_mezcla_comentarios(self):
        otra = self._solicitud(self.admision)
        adolescente = self._adolescente(otra, sexo="M")
        self._comentario(otra, "Solo para la otra identidad")
        self.assertEqual(self._buscar(dni="50000001")["count"], 2)
        detalle = self.client.get(f"/historial/{adolescente.pk}/").data
        self.assertEqual([item["id"] for item in detalle["solicitudes"]], [otra.pk])
        original = self.client.get(f"/historial/{self.adolescente.pk}/").data
        self.assertNotIn(otra.pk, [item["id"] for item in original["solicitudes"]])

    def test_no_duplica_solicitudes_ni_comentarios_por_registros_repetidos(self):
        self._adolescente(self.validada)
        self.assertEqual(self._buscar(dni="50000001")["count"], 1)
        datos = self.client.get(f"/historial/{self.adolescente.pk}/").data
        self.assertEqual(len(datos["solicitudes"]), 3)
        self.assertEqual(sum(len(item["comentarios"]) for item in datos["solicitudes"]), 2)

    def test_incluye_no_validados_y_excluye_personas_sin_registro_de_adolescente(self):
        self._persona("30000001")
        pendiente = self._adolescente(self.pendiente, dni="50000002", nombre="Sofia", apellido="Perez")
        resultado = self._buscar(nombre="Sofia")["results"][0]
        self.assertEqual(resultado["id"], pendiente.pk)
        self.assertFalse(resultado["validado"])
        self.assertIsNone(resultado["legajo"])
        self.assertEqual(self._buscar(dni="30000001")["count"], 0)

    def test_legajo_local_usa_su_numero_local_sin_letra(self):
        legajo = Legajo.objects.create(carpeta=self.legajo.carpeta, letra="B")
        persona = self._persona("50000003", legajo=legajo)
        self._adolescente(self.pendiente, dni=persona.dni, persona=persona)
        resultado = self._buscar(legajo=legajo.pk)
        self.assertEqual(resultado["count"], 1)
        self.assertEqual(resultado["results"][0]["dni"], persona.dni)
        self.assertEqual(resultado["results"][0]["legajo"], legajo.pk)
        self.assertNotIn("letra", resultado["results"][0])

    def test_consulta_paginada_y_sin_criterios_no_enumera_personas(self):
        for numero in range(21):
            self._adolescente(self.pendiente, dni=str(60000000 + numero), nombre="Grupo", apellido="Prueba")
        primera = self._buscar(nombre="Grupo")
        segunda = self._buscar(nombre="Grupo", page=2)
        self.assertEqual(primera["count"], 21)
        self.assertEqual(len(primera["results"]), 20)
        self.assertEqual(len(segunda["results"]), 1)
        self.assertIsNotNone(primera["next"])
        self.assertIsNone(segunda["next"])
        self.assertFalse({n["id"] for n in primera["results"]} & {n["id"] for n in segunda["results"]})
        for filtros in ({}, {"nombre": " "}, {"nombre": "a"}, {"dni": "abc"}, {"legajo": -1}, {"legajo": 2147483648}):
            self.assertEqual(self.client.get("/historial/", filtros).status_code, 400)

    def test_comentarios_ordenados_y_fecha_de_edicion_preservada(self):
        nuevo = self._comentario(self.validada, "<b>Texto libre</b>")
        nuevo.fecha_hora_ultmod += timedelta(hours=1)
        nuevo.save(update_fields=["fecha_hora_ultmod"])
        detalle = self.client.get(f"/historial/{self.adolescente.pk}/").data
        comentarios = detalle["solicitudes"][-1]["comentarios"]
        self.assertEqual([item["id"] for item in comentarios], [nuevo.pk, self.comentario.pk])
        self.assertNotEqual(comentarios[0]["fecha_hora_creacion"], comentarios[0]["fecha_hora_ultmod"])

    def test_solo_usuarios_operativos_y_solo_lectura(self):
        antes = SolicitudComentario.objects.count()
        for metodo in ("post", "put", "patch", "delete"):
            respuesta = getattr(self.client, metodo)(f"/historial/{self.adolescente.pk}/", {}, format="json")
            self.assertEqual(respuesta.status_code, 405)
        self.assertEqual(SolicitudComentario.objects.count(), antes)
        sin_equipo = Usuario.objects.create(username="sin-equipo")
        no_operativo = Usuario.objects.create(username="ajeno", equipo=Equipo.objects.create(nombre="Otro"))
        for usuario in (sin_equipo, no_operativo):
            self.client.force_authenticate(usuario)
            self.assertEqual(self.client.get("/historial/", {"dni": "50000001"}).status_code, 403)
            self.assertEqual(self.client.get(f"/historial/{self.adolescente.pk}/").status_code, 403)
        cliente = APIClient()
        self.assertIn(cliente.get("/historial/", {"dni": "50000001"}).status_code, (401, 403))
        self.assertIn(cliente.get(f"/historial/{self.adolescente.pk}/").status_code, (401, 403))

    def test_identificador_inexistente_o_no_numerico_devuelve_404(self):
        for identificador in (9999, "abc"):
            self.assertEqual(self.client.get(f"/historial/{identificador}/").status_code, 404)

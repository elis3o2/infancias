from datetime import timedelta
from unittest.mock import patch

from django.apps import apps
from django.db import connection
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate

from src.apps.solicitud.models import MotivoSolicitud, Solicitud, SolicitudComentario
from src.apps.solicitud.views import SolicitudViewSet
from src.models import Equipo, Usuario


class SolicitudComentariosTests(TestCase):
    """Permisos y fechas con SQLite en memoria; nunca usa archivos .db."""

    @classmethod
    def setUpClass(cls):
        if connection.vendor != "sqlite" or "memory" not in connection.settings_dict["NAME"]:
            raise RuntimeError("Estas pruebas requieren SQLite en memoria.")
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
        red.start()
        self.addCleanup(red.stop)
        self.factory = APIRequestFactory()
        self.entrada = Equipo.objects.create(id=1, nombre="Entrada")
        self.admision = Equipo.objects.create(id=2, nombre="Admisión")
        self.territorial = Equipo.objects.create(id=3, nombre="Territorial")
        self.autor = Usuario.objects.create(username="autor", equipo=self.admision)
        self.otro = Usuario.objects.create(username="otro", equipo=self.admision)
        self.usuario_entrada = Usuario.objects.create(username="entrada", equipo=self.entrada)
        self.usuario_territorial = Usuario.objects.create(username="territorial", equipo=self.territorial)
        self.motivo = MotivoSolicitud.objects.create(nombre="Consulta")
        self.solicitud = self._solicitud()

    def _solicitud(self, **cambios):
        datos = {
            "motivo": self.motivo, "correo": "", "telefono": "123456",
            "descripcion": "Solicitud de prueba", "fecha_hora_creacion": timezone.now(),
            "validado": True, "rechazado": False, "equipo": self.admision,
        }
        return Solicitud.objects.create(**{**datos, **cambios})

    def _request(self, accion, usuario, datos=None, solicitud=None, comentario_id=None):
        metodo = {"retrieve": "get", "comentar": "post", "editar_comentario": "patch"}[accion]
        request = getattr(self.factory, metodo)("/api/solicitud/solicitud/", datos, format="json")
        if usuario:
            force_authenticate(request, user=usuario)
        kwargs = {"pk": (solicitud or self.solicitud).pk}
        if comentario_id is not None:
            kwargs["comentario_id"] = comentario_id
        return SolicitudViewSet.as_view({metodo: accion})(request, **kwargs)

    def _comentario(self, usuario=None, solicitud=None):
        fecha = timezone.now() - timedelta(days=1)
        return SolicitudComentario.objects.create(
            solicitud=solicitud or self.solicitud, usuario=usuario or self.autor,
            comentario="Texto original", fecha_hora_creacion=fecha, fecha_hora_ultmod=fecha,
        )

    def test_crea_texto_y_fechas_del_servidor_sin_permitir_suplantar_autor(self):
        response = self._request("comentar", self.autor, {
            "comentario": "  Primer párrafo\nSegundo párrafo  ", "usuario": self.otro.pk,
            "fecha_hora_creacion": "2000-01-01T00:00:00", "fecha_hora_ultmod": "2000-01-01T00:00:00",
        })
        self.assertEqual(response.status_code, 201, response.data)
        comentario = SolicitudComentario.objects.get()
        self.assertEqual(comentario.usuario_id, self.autor.pk)
        self.assertEqual(comentario.comentario, "Primer párrafo\nSegundo párrafo")
        self.assertEqual(comentario.fecha_hora_creacion, comentario.fecha_hora_ultmod)
        self.assertGreater(comentario.fecha_hora_creacion, timezone.now() - timedelta(minutes=1))
        self.assertEqual(response.data["usuario_nombre"], "autor")
        self.assertTrue(response.data["puede_editar"])

    def test_solo_autor_edita_y_conserva_fecha_original(self):
        comentario = self._comentario()
        fecha = comentario.fecha_hora_creacion
        response = self._request("editar_comentario", self.autor, {
            "comentario": "Texto corregido", "usuario": self.otro.pk,
            "fecha_hora_creacion": "2000-01-01T00:00:00",
        }, comentario_id=comentario.pk)
        self.assertEqual(response.status_code, 200, response.data)
        comentario.refresh_from_db()
        self.assertEqual(comentario.comentario, "Texto corregido")
        self.assertEqual(comentario.usuario_id, self.autor.pk)
        self.assertEqual(comentario.fecha_hora_creacion, fecha)
        self.assertGreater(comentario.fecha_hora_ultmod, fecha)

    def test_otros_usuarios_y_superusuarios_no_editan_comentarios_ajenos(self):
        comentario = self._comentario()
        for superusuario in (False, True):
            with self.subTest(superusuario=superusuario):
                self.otro.is_superuser = superusuario
                response = self._request("editar_comentario", self.otro, {
                    "comentario": "Edición ajena", "usuario": self.autor.pk,
                }, comentario_id=comentario.pk)
                self.assertEqual(response.status_code, 403, response.data)
        comentario.refresh_from_db()
        self.assertEqual(comentario.comentario, "Texto original")
        self.assertEqual(comentario.fecha_hora_ultmod, comentario.fecha_hora_creacion)

    def test_rechaza_comentarios_vacios_ausentes_y_mayores_a_256(self):
        comentario = self._comentario()
        for datos in ({}, {"comentario": ""}, {"comentario": " \n "}, {"comentario": "a" * 257}):
            for accion in ("comentar", "editar_comentario"):
                with self.subTest(datos=datos, accion=accion):
                    response = self._request(accion, self.autor, datos,
                                             comentario_id=comentario.pk if accion == "editar_comentario" else None)
                    self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(SolicitudComentario.objects.count(), 1)
        comentario.refresh_from_db()
        self.assertEqual(comentario.comentario, "Texto original")
        response = self._request("comentar", self.autor, {"comentario": "a" * 256})
        self.assertEqual(response.status_code, 201, response.data)

    def test_no_permite_comentar_fuera_de_admision_ni_solicitudes_no_validadas(self):
        for equipo, usuario in ((self.entrada, self.usuario_entrada), (self.territorial, self.usuario_territorial)):
            with self.subTest(equipo=equipo):
                solicitud = self._solicitud(equipo=equipo)
                response = self._request("comentar", usuario, {"comentario": "Texto"}, solicitud=solicitud)
                self.assertEqual(response.status_code, 403, response.data)
        for cambios in ({"validado": False}, {"rechazado": True}):
            with self.subTest(cambios=cambios):
                solicitud = self._solicitud(**cambios)
                response = self._request("comentar", self.autor, {"comentario": "Texto"}, solicitud=solicitud)
                self.assertEqual(response.status_code, 403, response.data)
        self.assertFalse(SolicitudComentario.objects.exists())

    def test_no_permite_comentario_ajeno_a_la_solicitud_ni_solicitud_de_otro_equipo(self):
        ajeno = self._comentario(solicitud=self._solicitud())
        response = self._request("editar_comentario", self.autor, {"comentario": "Texto"}, comentario_id=ajeno.pk)
        self.assertEqual(response.status_code, 404, response.data)
        otra = self._solicitud(equipo=self.territorial)
        response = self._request("comentar", self.autor, {"comentario": "Texto"}, solicitud=otra)
        self.assertEqual(response.status_code, 404, response.data)

    def test_detalle_muestra_autor_fechas_orden_y_permiso_individual(self):
        propio = self._comentario()
        ajeno = self._comentario(usuario=self.otro)
        response = self._request("retrieve", self.autor)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data["puede_comentar"])
        self.assertEqual([item["id"] for item in response.data["comentarios"]], [propio.pk, ajeno.pk])
        self.assertEqual([item["puede_editar"] for item in response.data["comentarios"]], [True, False])
        self.assertEqual([item["usuario_nombre"] for item in response.data["comentarios"]], ["autor", "otro"])

    def test_al_derivar_conserva_historial_pero_queda_solo_lectura(self):
        comentario = self._comentario()
        self.solicitud.equipo = self.territorial
        self.solicitud.save(update_fields=["equipo"])
        response = self._request("retrieve", self.usuario_territorial)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertFalse(response.data["puede_comentar"])
        self.assertFalse(response.data["comentarios"][0]["puede_editar"])
        self.assertEqual(response.data["comentarios"][0]["comentario"], comentario.comentario)
        self.autor.equipo = self.territorial
        response = self._request("editar_comentario", self.autor, {"comentario": "Cambio"}, comentario_id=comentario.pk)
        self.assertEqual(response.status_code, 403, response.data)

    def test_sin_autenticacion_no_crea_ni_edita(self):
        comentario = self._comentario()
        for accion in ("comentar", "editar_comentario"):
            response = self._request(accion, None, {"comentario": "Texto"},
                                     comentario_id=comentario.pk if accion == "editar_comentario" else None)
            self.assertIn(response.status_code, (401, 403))
        self.assertEqual(SolicitudComentario.objects.count(), 1)

    @override_settings(ROOT_URLCONF="src.apps.solicitud.urls")
    def test_rutas_reales_para_crear_editar_y_recargar(self):
        cliente = APIClient()
        cliente.force_authenticate(user=self.autor)
        url = f"/solicitud/{self.solicitud.pk}/"
        response = cliente.post(f"{url}comentar/", {"comentario": "Primer texto"}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        comentario_id = response.data["id"]
        response = cliente.patch(f"{url}comentarios/{comentario_id}/", {"comentario": "Texto editado"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        response = cliente.get(url)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["comentarios"][0]["comentario"], "Texto editado")
        self.assertIn(cliente.delete(f"{url}comentarios/{comentario_id}/").status_code, (403, 405))
        self.assertTrue(SolicitudComentario.objects.filter(pk=comentario_id).exists())

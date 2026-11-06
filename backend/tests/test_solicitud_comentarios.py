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

    def test_rechaza_comentarios_vacios_o_ausentes(self):
        comentario = self._comentario()
        for datos in ({}, {"comentario": ""}, {"comentario": " \n "}):
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

    def test_crea_edita_y_recupera_comentarios_largos_sin_truncar(self):
        texto = "Seguimiento del niño\n" * 5000
        response = self._request("comentar", self.autor, {"comentario": texto})
        self.assertEqual(response.status_code, 201, response.data)
        comentario = SolicitudComentario.objects.get(pk=response.data["id"])
        self.assertEqual(comentario.comentario, texto.strip())
        fecha_original = comentario.fecha_hora_creacion
        nuevo = "Actualización\n" + texto + "Fin del comentario."
        response = self._request("editar_comentario", self.autor, {"comentario": nuevo}, comentario_id=comentario.pk)
        self.assertEqual(response.status_code, 200, response.data)
        comentario.refresh_from_db()
        self.assertEqual(comentario.comentario, nuevo)
        self.assertEqual(comentario.fecha_hora_creacion, fecha_original)
        detalle = self._request("retrieve", self.autor)
        self.assertEqual(detalle.data["comentarios"][0]["comentario"], nuevo)

    def test_territorial_no_comenta_y_admision_no_comenta_pendientes_o_rechazadas(self):
        solicitud = self._solicitud(equipo=self.territorial)
        response = self._request("comentar", self.usuario_territorial, {"comentario": "Texto"}, solicitud=solicitud)
        self.assertEqual(response.status_code, 403, response.data)
        for cambios in ({"validado": False}, {"rechazado": True}):
            with self.subTest(cambios=cambios):
                solicitud = self._solicitud(**cambios)
                response = self._request("comentar", self.autor, {"comentario": "Texto"}, solicitud=solicitud)
                self.assertEqual(response.status_code, 403, response.data)
        self.assertFalse(SolicitudComentario.objects.exists())

    def test_no_permite_comentario_de_otra_solicitud_ni_pendientes_de_otro_equipo(self):
        ajeno = self._comentario(solicitud=self._solicitud())
        response = self._request("editar_comentario", self.autor, {"comentario": "Texto"}, comentario_id=ajeno.pk)
        self.assertEqual(response.status_code, 404, response.data)
        otra = self._solicitud(equipo=self.territorial, validado=False)
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

    def test_equipo_receptor_conserva_historial_en_solo_lectura(self):
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

    def test_entrada_registra_y_edita_situaciones_antes_de_validar(self):
        solicitud = self._solicitud(equipo=self.entrada, validado=False)
        response = self._request("comentar", self.usuario_entrada, {"comentario": "Situación inicial"}, solicitud=solicitud)
        self.assertEqual(response.status_code, 201, response.data)
        comentario_id = response.data["id"]
        response = self._request("editar_comentario", self.usuario_entrada, {"comentario": "Texto corregido"},
                                 solicitud=solicitud, comentario_id=comentario_id)
        self.assertEqual(response.status_code, 200, response.data)
        detalle = self._request("retrieve", self.usuario_entrada, solicitud=solicitud)
        self.assertTrue(detalle.data["puede_comentar"])
        self.assertEqual(detalle.data["comentarios"][0]["comentario"], "Texto corregido")
        self.assertTrue(detalle.data["comentarios"][0]["puede_editar"])
        self.assertEqual(self._request("retrieve", self.autor, solicitud=solicitud).status_code, 404)

    def test_ambas_areas_comentan_derivadas_sin_exigir_paso_previo(self):
        self.solicitud.equipo = self.territorial
        self.solicitud.save(update_fields=["equipo"])
        self.assertIsNone(self.solicitud.fecha_hora_entrada)
        self.assertIsNone(self.solicitud.fecha_hora_admision)
        for usuario in (self.autor, self.usuario_entrada):
            with self.subTest(usuario=usuario.username):
                detalle = self._request("retrieve", usuario)
                self.assertEqual(detalle.status_code, 200, detalle.data)
                self.assertTrue(detalle.data["puede_comentar"])
                self.assertFalse(detalle.data["puede_agregar_personas"])
                respuesta = self._request("comentar", usuario, {"comentario": "Seguimiento posterior"})
                self.assertEqual(respuesta.status_code, 201, respuesta.data)
                comentario_id = respuesta.data["id"]
                respuesta = self._request("editar_comentario", usuario, {"comentario": "Seguimiento corregido"}, comentario_id=comentario_id)
                self.assertEqual(respuesta.status_code, 200, respuesta.data)
                otro = self.usuario_entrada if usuario == self.autor else self.autor
                respuesta = self._request("editar_comentario", otro, {"comentario": "No autorizado"}, comentario_id=comentario_id)
                self.assertEqual(respuesta.status_code, 403, respuesta.data)
        self.solicitud.refresh_from_db()
        self.assertEqual(self.solicitud.equipo_id, self.territorial.pk)
        self.assertIsNone(self.solicitud.fecha_hora_entrada)
        self.assertIsNone(self.solicitud.fecha_hora_admision)

    def test_el_autor_de_admision_puede_editar_lo_escrito_antes_de_derivar(self):
        comentario = self._comentario()
        fecha = comentario.fecha_hora_creacion
        self.solicitud.equipo = self.territorial
        self.solicitud.save(update_fields=["equipo"])
        response = self._request("editar_comentario", self.autor, {"comentario": "Actualizado después de derivar"}, comentario_id=comentario.pk)
        self.assertEqual(response.status_code, 200, response.data)
        comentario.refresh_from_db()
        self.assertEqual(comentario.fecha_hora_creacion, fecha)
        self.assertEqual(comentario.usuario_id, self.autor.pk)

    @override_settings(ROOT_URLCONF="src.apps.solicitud.urls")
    def test_listados_incluyen_derivadas_pero_no_otorgan_otras_acciones(self):
        derivada = self._solicitud(equipo=self.territorial)
        pendiente_ajena = self._solicitud(equipo=self.territorial, validado=False)
        rechazada_ajena = self._solicitud(equipo=self.territorial, validado=False, rechazado=True)
        for usuario in (self.autor, self.usuario_entrada):
            cliente = APIClient()
            cliente.force_authenticate(user=usuario)
            for ruta in ("/solicitud/", "/solicitud/validados/"):
                respuesta = cliente.get(ruta)
                self.assertEqual(respuesta.status_code, 200, respuesta.data)
                ids = {item["id"] for item in respuesta.data}
                self.assertIn(derivada.pk, ids)
                self.assertNotIn(pendiente_ajena.pk, ids)
                self.assertNotIn(rechazada_ajena.pk, ids)
            for accion, metodo in (("derivar", "put"), ("validar", "put"), ("rechazar", "put"),
                                   ("familiares", "post"), ("adolescentes", "post")):
                respuesta = getattr(cliente, metodo)(f"/solicitud/{derivada.pk}/{accion}/", {}, format="json")
                self.assertIn(respuesta.status_code, (403, 404), (accion, respuesta.data))
            self.assertEqual(cliente.post(f"/solicitud/{rechazada_ajena.pk}/comentar/", {"comentario": "Texto"}).status_code, 404)
        derivada.refresh_from_db()
        self.assertEqual(derivada.equipo_id, self.territorial.pk)

    @override_settings(ROOT_URLCONF="src.apps.solicitud.urls")
    def test_otros_equipos_no_ganan_acceso_cruzado(self):
        cliente = APIClient()
        cliente.force_authenticate(user=self.usuario_territorial)
        respuesta = cliente.get("/solicitud/")
        self.assertEqual(respuesta.status_code, 200)
        self.assertNotIn(self.solicitud.pk, {item["id"] for item in respuesta.data})
        self.assertEqual(cliente.get(f"/solicitud/{self.solicitud.pk}/").status_code, 404)

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

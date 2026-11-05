"""Rutas de despliegue, sin base de datos ni llamadas externas."""

from django.test import SimpleTestCase, override_settings
from django.urls import resolve


@override_settings(
    ROOT_URLCONF="core.urls",
    ALLOWED_HOSTS=["salud1.dyndns.org", "192.168.64.49"],
    MIDDLEWARE=["django.middleware.common.CommonMiddleware"],
    TEMPLATES=[{
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "OPTIONS": {"loaders": [(
            "django.template.loaders.locmem.Loader",
            {"index.html": '<div id="root"></div>'},
        )]},
    }],
)
class DespliegueTests(SimpleTestCase):
    def test_raiz_y_prefijo_redirigen_a_buscar(self):
        for host in ("salud1.dyndns.org", "192.168.64.49:7451"):
            for ruta in ("/", "/infancias", "/infancias/"):
                with self.subTest(host=host, ruta=ruta):
                    respuesta = self.client.get(ruta, HTTP_HOST=host)
                    self.assertEqual(respuesta.status_code, 302)
                    self.assertEqual(respuesta["Location"], "/infancias/buscar")
                    destino = self.client.get(respuesta["Location"], HTTP_HOST=host)
                    self.assertContains(destino, '<div id="root"></div>')

    def test_paginas_pueden_recargarse_en_ambos_origenes(self):
        for host, https in (("salud1.dyndns.org", True), ("192.168.64.49:7451", False)):
            for ruta in ("buscar", "login/", "solicitud", "validar/7", "historial/7", "reportes"):
                with self.subTest(host=host, ruta=ruta):
                    respuesta = self.client.get(f"/infancias/{ruta}", HTTP_HOST=host, secure=https)
                    self.assertContains(respuesta, '<div id="root"></div>')

    def test_api_con_prefijo_usa_las_mismas_vistas(self):
        for ruta in ("token/", "token/refresh/", "solicitud/solicitud/"):
            with self.subTest(ruta=ruta):
                original = resolve(f"/api/{ruta}")
                publicada = resolve(f"/infancias/api/{ruta}")
                self.assertIs(original.func, publicada.func)
                self.assertEqual(original.url_name, publicada.url_name)

    def test_api_y_archivos_inexistentes_no_devuelven_html_de_la_app(self):
        for ruta in ("api/no-existe/", "api", "assets/no-existe.js", "no-existe.png"):
            with self.subTest(ruta=ruta):
                respuesta = self.client.get(f"/infancias/{ruta}", HTTP_HOST="salud1.dyndns.org")
                self.assertEqual(respuesta.status_code, 404)

    def test_no_se_acepta_cualquier_host(self):
        respuesta = self.client.get("/infancias/", HTTP_HOST="otro.example")
        self.assertEqual(respuesta.status_code, 400)

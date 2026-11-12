from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from src.apps.api_externa.identidad_types import (
    IdentidadHTTPError, IdentidadLimiteExcedido, IdentidadRespuestaParcial,
    IdentidadRevisionRequerida,
)
from src.apps.api_externa.types import ServicioExternoError, ServicioExternoNoConfigurado
from src.apps.persona.views import ConsultaPersonasAPIView


class ConsultaPersonasErroresTests(SimpleTestCase):
    def consultar(self, error):
        request = APIRequestFactory().get("/casainfancias/api/persona/ciudadano/", {"adolescentes": "[]"})
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True, is_superuser=True, equipo_id=1))
        with patch("src.apps.persona.views.consultar_personas", side_effect=error):
            return ConsultaPersonasAPIView.as_view()(request)

    def test_revision_humana_se_informa_como_conflicto(self):
        respuesta = self.consultar(IdentidadRevisionRequerida())
        self.assertEqual(respuesta.status_code, 409)
        self.assertIn("revisión humana", respuesta.data["detail"])
        self.assertNotIn("adolescentes", respuesta.data)

    def test_limite_se_informa_con_retry_after(self):
        respuesta = self.consultar(IdentidadLimiteExcedido(120, remoto=True))
        self.assertEqual(respuesta.status_code, 429)
        self.assertEqual(respuesta["Retry-After"], "120")
        self.assertIn("120", respuesta.data["detail"])

    def test_parcial_o_falta_de_configuracion_no_rechaza_personas(self):
        for error in (IdentidadRespuestaParcial(), ServicioExternoNoConfigurado()):
            with self.subTest(error=error):
                respuesta = self.consultar(error)
                self.assertEqual(respuesta.status_code, 503)
                self.assertEqual(set(respuesta.data), {"detail"})

    def test_error_de_proveedor_no_invalida_sesion_del_usuario(self):
        for error in (IdentidadHTTPError(401, "Clave inválida"), IdentidadHTTPError(403, "Sin permiso"),
                      ServicioExternoError("TLS"), IdentidadHTTPError(504, "Timeout")):
            with self.subTest(error=error):
                respuesta = self.consultar(error)
                self.assertEqual(respuesta.status_code, 502)
                self.assertEqual(set(respuesta.data), {"detail"})

    def test_404_remoto_no_es_limite_ni_persona_inexistente(self):
        respuesta = self.consultar(IdentidadHTTPError(404, "Identidad respondió con HTTP 404."))
        self.assertEqual(respuesta.status_code, 502)
        self.assertNotIn("Retry-After", respuesta)
        self.assertEqual(set(respuesta.data), {"detail"})
        self.assertIn("HTTP 404", respuesta.data["detail"])
        self.assertIn("API_RNP e IDENTIDAD_HTTP_METHOD", respuesta.data["detail"])
        self.assertIn("no confirma que la persona no exista", respuesta.data["detail"])

import json
from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from src.apps.api_externa.identidad_types import (
    IdentidadHTTPError, IdentidadLimiteExcedido, IdentidadRespuestaParcial,
    IdentidadRevisionRequerida, ResultadoIdentidad,
)
from src.apps.api_externa.services import Digitalizacion as digitalizacion
from src.apps.api_externa.types import ServicioExternoError, ServicioExternoNoConfigurado
from src.apps.persona.services import Consulta as consulta, HistoriaClinica as historia
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

    def test_404_deja_a_la_persona_sin_validar_y_continua_con_las_demas(self):
        for tipo_fallido, dni_fallido in (("adolescentes", "12345678"), ("familiares", "87654321")):
            with self.subTest(tipo=tipo_fallido):
                def consultar_identidad(dni, sexo, *, secciones):
                    if dni == dni_fallido:
                        raise IdentidadHTTPError(404, "Identidad respondió HTTP 404.")
                    return ResultadoIdentidad(200, {"persona": {"estado": "ok", "datos": {
                        "dni": dni, "sexo": sexo, "nombres": "Prueba", "apellido": "Ficticia",
                        "fecha_nacimiento": "2000-01-01", "requiere_revision": False,
                    }}})

                request = APIRequestFactory().get("/casainfancias/api/persona/ciudadano/", {
                    "adolescentes": json.dumps([{"id": 1, "dni": "12345678", "sexo": "F"}]),
                    "familiares": json.dumps([{"id": 2, "dni": "87654321", "sexo": "F"}]),
                })
                force_authenticate(request, user=SimpleNamespace(is_authenticated=True, is_superuser=True, equipo_id=1))
                with (
                    patch.object(digitalizacion, "_consultar_api_digitalizacion", return_value={}),
                    patch.object(digitalizacion, "consultar_identidad", side_effect=consultar_identidad) as proveedor,
                    patch.object(consulta, "buscar_persona", return_value=None),
                    patch.object(consulta, "consultar_solicitudes", return_value=[]),
                    patch.object(historia, "consultar_hcf") as hcf,
                    patch("requests.sessions.Session.request", side_effect=AssertionError("HTTP real prohibido")),
                ):
                    respuesta = ConsultaPersonasAPIView.as_view()(request)
                self.assertEqual(respuesta.status_code, 200)
                self.assertEqual(set(respuesta.data), {"adolescentes", "familiares", "hcf"})
                self.assertNotIn("Retry-After", respuesta)
                self.assertIsNone(respuesta.data[tipo_fallido][0]["ciudadano"])
                self.assertIsNone(respuesta.data[tipo_fallido][0]["persona"])
                otro_tipo = "familiares" if tipo_fallido == "adolescentes" else "adolescentes"
                self.assertIsNotNone(respuesta.data[otro_tipo][0]["ciudadano"])
                self.assertEqual(proveedor.call_count, 2)
                hcf.assert_not_called()

"""La segunda etapa consulta solo HCI, sin repetir identidad ni acceder a la BD."""
from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase
from django.urls import resolve
from rest_framework.test import APIRequestFactory, force_authenticate

from src.apps.api_externa.serializers import ConsultaHistoriaClinicaSerializer
from src.apps.api_externa.types import ServicioExternoError, ServicioExternoNoConfigurado
from src.apps.api_externa.views import HistoriaClinicaAPIView
from tests.test_consulta_personas import integrante


class HistoriaClinicaEndpointTests(SimpleTestCase):
    def setUp(self):
        red = patch("requests.sessions.Session.request", side_effect=AssertionError("HTTP real prohibido"))
        red.start()
        self.addCleanup(red.stop)

    def consultar(self, datos=None, *, autenticado=True):
        request = APIRequestFactory().get("/api/externa/historia-clinica/", datos or {})
        if autenticado:
            force_authenticate(request, user=SimpleNamespace(is_authenticated=True, is_superuser=True, equipo_id=1))
        return HistoriaClinicaAPIView.as_view()(request)

    def test_endpoint_esta_registrado(self):
        for ruta in ("/api/externa/historia-clinica/", "/casainfancias/api/externa/historia-clinica/"):
            self.assertIs(resolve(ruta, urlconf="core.urls").func.view_class, HistoriaClinicaAPIView)

    def test_consulta_hci_y_devuelve_salud_e_integrantes_sin_reconsultar_identidad(self):
        datos = {"hcf": "50", "resultados": [integrante(100, "50000001"), integrante(200, "30000001")]}
        with (
            patch("src.apps.api_externa.views.consultar_hcf", return_value=datos) as hcf,
            patch("src.apps.persona.services.Consulta.consultar_digitalizacion") as identidad,
        ):
            respuesta = self.consultar({"hci": "100"})
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data, datos)
        hcf.assert_called_once_with(hci=100)
        identidad.assert_not_called()

    def test_sin_historia_es_distinto_de_error_del_proveedor(self):
        with patch("src.apps.api_externa.views.consultar_hcf", return_value=None):
            respuesta = self.consultar({"hci": 100})
        self.assertEqual(respuesta.status_code, 200)
        self.assertIsNone(respuesta.data)
        for error, estado in ((ServicioExternoError("Timeout"), 502), (ServicioExternoNoConfigurado(), 503)):
            with self.subTest(error=error), patch("src.apps.api_externa.views.consultar_hcf", side_effect=error):
                respuesta = self.consultar({"hci": 100})
                self.assertEqual(respuesta.status_code, estado)
                self.assertEqual(set(respuesta.data), {"detail"})

    def test_valida_hci_sin_campos_innecesarios(self):
        self.assertEqual(set(ConsultaHistoriaClinicaSerializer().fields), {"hci"})
        for datos in ({}, {"hci": 0}, {"hci": -1}, {"hci": "incorrecto"}, {"hci": "1.5"}, {"dni": "50000001", "sexo": "M"}):
            with self.subTest(datos=datos), patch("src.apps.api_externa.views.consultar_hcf") as hcf:
                self.assertEqual(self.consultar(datos).status_code, 400)
                hcf.assert_not_called()

    def test_no_expone_datos_sin_autenticacion(self):
        with patch("src.apps.api_externa.views.consultar_hcf") as hcf:
            self.assertIn(self.consultar({"hci": 100}, autenticado=False).status_code, (401, 403))
            hcf.assert_not_called()

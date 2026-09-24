from copy import deepcopy
from unittest import TestCase
from unittest.mock import Mock, patch

import requests

from src.apps.api_externa import services, utils
from src.apps.api_externa.types import Ciudadano


class ApiExternaPersonasTests(TestCase):
    """Contratos exactos y transporte HTTP simulado, sin configuración real."""

    def setUp(self):
        configuracion = {
            "API_DIGITALIZACION": "https://digitalizacion.example.test/",
            "KEY_DIGITALIZACION": "prueba-digitalizacion",
            "API_HCF": "https://hcf.example.test/", "HCF_PPVV_API_KEY": "prueba-hcf",
            "API_CIUDADANO": "https://ciudadano.example.test/", "KEY_CIUDADANO": "prueba-ciudadano",
        }
        for modulo in (services, utils):
            parche = patch.object(modulo, "config", side_effect=lambda nombre, default="": configuracion.get(nombre, default))
            parche.start()
            self.addCleanup(parche.stop)
        red = patch("requests.sessions.Session.request", side_effect=AssertionError("HTTP real prohibido"))
        red.start()
        self.addCleanup(red.stop)
        self.identidad = {
            "nombre": "Nombre", "apellido": "Prueba", "nroDocumento": 50000001,
            "sexo": "M", "fechaNacimiento": "Mon, 18 Feb 2008 00:00:00 GMT",
        }
        self.digitalizacion = {
            "sisa_data": {"ciudadano": self.identidad.copy()},
            "results_query1": [{"hc": "00100", "doc": 30000001, "sexo": "F",
                                "apenom": "NO USAR", "fna": "1900-01-01"}, {"hc": "200"}],
        }

    def test_digitalizacion_identidad_de_sisa_y_solo_primera_hc_sin_proxy(self):
        with patch.object(utils.requests, "Session") as session_class:
            session = session_class.return_value.__enter__.return_value
            session.get.return_value.status_code = 200
            session.get.return_value.json.return_value = self.digitalizacion
            resultado = services.consultar_digitalizacion("50000001", "M")
        self.assertEqual(resultado, {**self.identidad, "hc": "00100"})
        self.assertFalse(session.trust_env)
        session.get.assert_called_once_with(
            "https://digitalizacion.example.test/", params={
                "api_key": "prueba-digitalizacion", "documento": "50000001", "sexo": "M",
            }, headers=None, timeout=utils.TIMEOUT_EXTERNO,
        )

    def test_sin_hc_conserva_identidad_y_no_busca_en_otro_resultado(self):
        for resultados in (None, [], [{"hc": None}, {"hc": "200"}], [{"hcf": "50"}], [None]):
            with self.subTest(resultados=resultados):
                data = {**self.digitalizacion, "results_query1": resultados}
                with patch.object(services, "_obtener_json", return_value=data):
                    self.assertEqual(services.consultar_digitalizacion("50000001", "M"), {
                        **self.identidad, "hc": None,
                    })

    def test_no_acepta_ubicaciones_o_nombres_alternativos_de_identidad(self):
        for campo, alias in (("nombre", "nombres"), ("apellido", "apellidos"),
                             ("nroDocumento", "dni"), ("fechaNacimiento", "fecha_nacimiento")):
            with self.subTest(campo=campo):
                data = deepcopy(self.digitalizacion)
                ciudadano = data["sisa_data"]["ciudadano"]
                ciudadano[alias] = ciudadano.pop(campo)
                with patch.object(services, "_obtener_json", return_value=data):
                    self.assertIsNone(services.consultar_digitalizacion("50000001", "M"))
        with patch.object(services, "_obtener_json", return_value={"ciudadano": self.identidad}):
            self.assertIsNone(services.consultar_digitalizacion("50000001", "M"))

    def test_hcf_devuelve_el_contrato_completo_y_consulta_sin_proxy(self):
        respuesta = {"hcf": "50", "resultados": []}
        with patch.object(utils.requests, "Session") as session_class:
            session = session_class.return_value.__enter__.return_value
            session.get.return_value.status_code = 200
            session.get.return_value.json.return_value = respuesta
            self.assertIs(services.consultar_hcf("100"), respuesta)
        self.assertFalse(session.trust_env)
        session.get.assert_called_once_with(
            "https://hcf.example.test/", params={"hcf": "100"},
            headers={"HCF_PPVV_API_KEY": "prueba-hcf"}, timeout=utils.TIMEOUT_EXTERNO,
        )

    def test_ciudadano_devuelve_clase_y_conserva_transporte_con_proxy(self):
        respuesta = Mock(status_code=200)
        respuesta.json.return_value = {"ciudadano": self.identidad}
        with (
            patch.object(services.requests, "get", return_value=respuesta) as get,
            patch.object(utils.requests, "Session") as session,
        ):
            ciudadano = services.consultar_ciudadano("50000001", "M")
        self.assertIsInstance(ciudadano, Ciudadano)
        self.assertEqual(ciudadano.como_dict(), self.identidad)
        session.assert_not_called()
        get.assert_called_once_with("https://ciudadano.example.test/", params={
            "dni": "50000001", "sexo": "M", "api_key": "prueba-ciudadano",
        }, timeout=utils.TIMEOUT_EXTERNO)

    def test_ciudadano_incompleto_no_crea_la_clase(self):
        for campo in self.identidad:
            with self.subTest(campo=campo):
                datos = self.identidad.copy()
                datos.pop(campo)
                respuesta = Mock(status_code=200)
                respuesta.json.return_value = {"ciudadano": datos}
                with patch.object(services.requests, "get", return_value=respuesta):
                    self.assertIsNone(services.consultar_ciudadano("50000001", "M"))

    def test_fallas_http_e_invalid_json_no_se_confunden_con_datos(self):
        for fallo in ("404", "500", "json", "conexion"):
            with self.subTest(fallo=fallo), patch.object(utils.requests, "Session") as session_class:
                session = session_class.return_value.__enter__.return_value
                respuesta = session.get.return_value
                respuesta.status_code = int(fallo) if fallo.isdigit() else 200
                if fallo == "500":
                    respuesta.raise_for_status.side_effect = requests.HTTPError()
                elif fallo == "json":
                    respuesta.json.side_effect = ValueError()
                elif fallo == "conexion":
                    session.get.side_effect = requests.ConnectionError()
                self.assertIsNone(services.consultar_hcf("100"))

from copy import deepcopy
from unittest import TestCase
from unittest.mock import Mock, patch
from urllib.parse import parse_qs, urlsplit

import requests

from src.apps.api_externa import services, utils
from src.apps.api_externa.services import Ciudadano as ciudadano_api, Digitalizacion as digitalizacion, HistoriaClinica as hcf
from src.apps.api_externa.types import Ciudadano, ServicioExternoError
from src.apps.api_externa.identidad_types import ResultadoIdentidad


class ApiExternaPersonasTests(TestCase):
    """Contratos exactos y transporte HTTP simulado, sin configuración real."""

    def setUp(self):
        configuracion = {
            "API_DIGITALIZACION": "https://digitalizacion.example.test/",
            "KEY_DIGITALIZACION": "prueba-digitalizacion",
            "API_HCF": "https://hcf.example.test/hcf", "HCF_PPVV_API_KEY": "prueba-hcf",
            "API_CIUDADANO": "https://ciudadano.example.test/", "KEY_CIUDADANO": "prueba-ciudadano",
        }
        self.configuracion = configuracion

        for modulo in (ciudadano_api, digitalizacion, hcf, utils):
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
                with patch.object(digitalizacion, "_obtener_json", return_value=data):
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
                with (
                    patch.object(digitalizacion, "_obtener_json", return_value=data),
                    patch.object(digitalizacion, "consultar_identidad", return_value=ResultadoIdentidad(200, data)),
                    self.assertRaises(ServicioExternoError),
                ):
                    services.consultar_digitalizacion("50000001", "M")
        datos = {"ciudadano": self.identidad}
        with (
            patch.object(digitalizacion, "_obtener_json", return_value=datos),
            patch.object(digitalizacion, "consultar_identidad", return_value=ResultadoIdentidad(200, datos)),
            self.assertRaises(ServicioExternoError),
        ):
            services.consultar_digitalizacion("50000001", "M")

    def test_hcf_devuelve_el_contrato_completo_y_consulta_sin_proxy(self):
        respuesta = {"hcf": 50, "resultados": []}
        with patch.object(utils.requests, "Session") as session_class:
            session = session_class.return_value.__enter__.return_value
            session.get.return_value.status_code = 200
            session.get.return_value.json.return_value = respuesta
            self.assertIs(services.consultar_hcf(hci="100"), respuesta)
        self.assertFalse(session.trust_env)
        session.get.assert_called_once_with(
            "https://hcf.example.test/hcf", params={"hci": "100"},
            headers={"HCF_PPVV_API_KEY": "prueba-hcf"}, timeout=(utils.TIMEOUT_EXTERNO, 60),
        )

    def test_timeout_hcf_fijo_sin_modificar_el_de_las_otras_apis(self):
        with patch.object(utils.requests, "Session") as session_class:
            session = session_class.return_value.__enter__.return_value
            session.get.return_value.status_code = 200
            session.get.return_value.json.return_value = {"hcf": 50, "resultados": []}
            self.assertIsNotNone(services.consultar_hcf("100"))
            self.assertEqual(session.get.call_args.kwargs["timeout"], (10, 60))
            session.get.return_value.json.return_value = self.digitalizacion
            self.assertIsNotNone(services.consultar_digitalizacion("50000001", "M"))
            self.assertEqual(session.get.call_args.kwargs["timeout"], 10)

    def test_hcf_conserva_el_manejo_de_error_si_se_agota_el_nuevo_timeout(self):
        with patch.object(utils.requests, "Session") as session_class:
            session = session_class.return_value.__enter__.return_value
            session.get.side_effect = requests.ReadTimeout()
            with self.assertRaises(ServicioExternoError):
                services.consultar_hcf("100")
            session.get.assert_called_once()
            self.assertEqual(session.get.call_args.kwargs["timeout"], (10, 60))

    def test_hcf_envia_una_sola_hci_aunque_la_url_ya_la_incluya(self):
        for sufijo in ("", "?hci=", "?hci=999", "?hci=&hci=999", "?origen=prueba%20local&hci="):
            for numero in (100, "100"):
                with self.subTest(sufijo=sufijo, numero=numero), patch.object(utils.requests, "Session") as session_class:
                    self.configuracion["API_HCF"] = f"https://hcf.example.test/hcf{sufijo}"
                    session = session_class.return_value.__enter__.return_value
                    session.get.return_value.status_code = 200
                    respuesta = {"hcf": 50, "resultados": []}
                    session.get.return_value.json.return_value = respuesta
                    self.assertIs(services.consultar_hcf(numero), respuesta)

                    session.get.assert_called_once()
                    llamada = session.get.call_args
                    preparada = requests.Request("GET", llamada.args[0], params=llamada.kwargs["params"]).prepare()
                    url = urlsplit(preparada.url)
                    parametros = parse_qs(url.query, keep_blank_values=True)
                    self.assertEqual(url.path, "/hcf")
                    self.assertEqual(parametros["hci"], ["100"])
                    self.assertNotIn("hcf", parametros)
                    if "origen" in sufijo:
                        self.assertEqual(parametros["origen"], ["prueba local"])
                    self.assertEqual(llamada.kwargs["headers"], {"HCF_PPVV_API_KEY": "prueba-hcf"})
                    self.assertFalse(session.trust_env)

    def test_ciudadano_devuelve_clase_y_conserva_transporte_con_proxy(self):
        respuesta = Mock(status_code=200)
        respuesta.json.return_value = {"ciudadano": self.identidad}
        with (
            patch.object(ciudadano_api.requests, "get", return_value=respuesta) as get,
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
                with patch.object(ciudadano_api.requests, "get", return_value=respuesta):
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
                if fallo == "404":
                    self.assertIsNone(services.consultar_hcf("100"))
                else:
                    with self.assertRaises(ServicioExternoError):
                        services.consultar_hcf("100")

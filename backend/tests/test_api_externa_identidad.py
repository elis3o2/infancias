from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

import requests

from src.apps.api_externa import identidad, identidad_config
from src.apps.api_externa.identidad_types import (
    IdentidadHTTPError, IdentidadLimiteExcedido, IdentidadRevisionRequerida,
)
from src.apps.api_externa.types import ServicioExternoError, ServicioExternoNoConfigurado


class ConsultarIdentidadTests(TestCase):
    def setUp(self):
        temporal = TemporaryDirectory()
        self.addCleanup(temporal.cleanup)
        self.directorio = Path(temporal.name)
        self.certificado = self.directorio / "ca.crt"
        self.certificado.write_text("Certificado simulado: no se usa una conexión TLS real.")
        self.variables = {
            "IDENTIDAD_API_URL": "https://identidad.example.test/v1/consulta",
            "IDENTIDAD_API_KEY": "clave-ficticia",
            "IDENTIDAD_CA_CERT": str(self.certificado),
            "IDENTIDAD_RATE_LIMIT_FILE": str(self.directorio / "limites.json"),
            "IDENTIDAD_HTTP_METHOD": "POST",
            "IDENTIDAD_USE_PROXY": False,
        }
        configuracion = patch.object(identidad_config, "config", side_effect=lambda nombre, default=None, **kwargs: self.variables.get(nombre, default))
        configuracion.start()
        self.addCleanup(configuracion.stop)
        red = patch("requests.sessions.Session.request", side_effect=AssertionError("No se permite HTTP real"))
        red.start()
        self.addCleanup(red.stop)
        session = patch.object(identidad.requests, "Session")
        self.session_class = session.start()
        self.addCleanup(session.stop)
        self.session = self.session_class.return_value.__enter__.return_value
        self.respuesta = self.session.request.return_value
        self.respuesta.status_code = 200
        self.respuesta.headers = {}
        self.cuerpo = {
            "estado": "ok", "persona": {"estado": "ok", "datos": {
                "nombres": "PRUEBA", "apellido": "FICTICIA", "dni": "12345678",
                "sexo": "F", "fecha_nacimiento": "2000-01-01", "requiere_revision": False,
            }},
            "coberturas": {"estado": "ok", "datos": []},
            "sisros": {"estado": "sin_datos", "datos": None},
        }
        self.respuesta.json.return_value = self.cuerpo
        reloj = patch("src.apps.api_externa.identidad_limites.time.time", return_value=200000.0)
        self.reloj = reloj.start()
        self.addCleanup(reloj.stop)

    def consultar(self, **kwargs):
        self.reloj.return_value += 4
        return identidad.consultar_identidad("12345678", "F", **kwargs)

    def test_post_json_cabecera_certificado_sin_proxy_ni_redirecciones(self):
        resultado = self.consultar(secciones=["renaper", "puco", "sisros"])
        self.assertFalse(resultado.parcial)
        self.assertEqual(resultado.codigo_http, 200)
        self.assertEqual(resultado.datos, self.cuerpo)
        self.assertFalse(self.session.trust_env)
        self.session.request.assert_called_once_with(
            "POST", self.variables["IDENTIDAD_API_URL"],
            json={"dni": "12345678", "sexo": "F", "secciones": ["renaper", "puco", "sisros"]},
            headers={"X-API-Key": "clave-ficticia", "Accept": "application/json"},
            verify=str(self.certificado), timeout=identidad.TIMEOUT_EXTERNO,
            allow_redirects=False,
        )

    def test_omitir_secciones_no_envia_array_y_get_es_explicito(self):
        self.variables["IDENTIDAD_HTTP_METHOD"] = "GET"
        self.consultar()
        self.assertEqual(self.session.request.call_args.args[0], "GET")
        self.assertEqual(self.session.request.call_args.kwargs["json"], {"dni": "12345678", "sexo": "F"})

    def test_respuesta_parcial_conserva_todos_los_datos_sin_crear_personas(self):
        self.respuesta.status_code = 207
        self.respuesta.json.return_value = {"persona": {"estado": "error", "datos": None}}
        resultado = self.consultar()
        self.assertTrue(resultado.parcial)
        self.assertEqual(resultado.datos, {"persona": {"estado": "error", "datos": None}})

    def test_admite_variables_rnp_y_conserva_clave_identidad(self):
        self.variables["API_RNP"] = "https://rnp.example.test/v1/consulta"
        self.variables["API_RNP_CA_PATH"] = str(self.certificado)
        self.variables["IDENTIDAD_CA_CERT"] = "/anterior-no-existe.crt"
        self.consultar()
        self.assertEqual(self.session.request.call_args.args, ("POST", self.variables["API_RNP"]))
        self.assertEqual(self.session.request.call_args.kwargs["verify"], str(self.certificado))
        self.assertEqual(self.session.request.call_args.kwargs["headers"]["X-API-Key"], "clave-ficticia")

    def test_x_no_puede_consultar_puco_ni_omitir_secciones(self):
        for secciones in (None, ["puco"], ["renaper", "puco"]):
            with self.subTest(secciones=secciones), self.assertRaises(ValueError):
                identidad.consultar_identidad("12345678", "X", secciones)
        self.session.request.assert_not_called()
        identidad.consultar_identidad("12345678", "X", ["renaper", "sisros"])
        self.assertEqual(self.session.request.call_args.kwargs["json"]["sexo"], "X")

    def test_validacion_antes_de_consumir_cupo(self):
        for dni, sexo, secciones in (("", "F", None), ("123a", "F", None), ("１２３", "F", None), ("123", "O", None), ("123", "F", []), ("123", "F", ["otra"]), ("123", "F", "renaper")):
            with self.subTest(dni=dni, sexo=sexo, secciones=secciones), self.assertRaises(ValueError):
                identidad.consultar_identidad(dni, sexo, secciones)
        self.session_class.assert_not_called()
        self.assertFalse((self.directorio / "limites.json").exists())

    def test_configuracion_ausente_o_insegura_no_hace_consultas(self):
        for nombre, valor in (("IDENTIDAD_API_KEY", ""), ("IDENTIDAD_CA_CERT", "/no-existe.crt"), ("IDENTIDAD_API_URL", "http://identidad.example.test"), ("IDENTIDAD_API_URL", "https://identidad.example.test/?clave=privada"), ("IDENTIDAD_HTTP_METHOD", "DELETE")):
            original = self.variables[nombre]
            with self.subTest(nombre=nombre), self.assertRaises(ServicioExternoNoConfigurado):
                self.variables[nombre] = valor
                self.consultar()
            self.variables[nombre] = original
        self.session_class.assert_not_called()

    def test_rutas_relativas_son_relativas_al_backend(self):
        self.assertEqual(identidad_config._ruta("certs/app1-identidad.crt"), identidad_config.BACKEND_DIR / "certs/app1-identidad.crt")

    def test_409_exige_revision_humana_sin_reintentos(self):
        self.respuesta.status_code = 409
        with self.assertRaises(IdentidadRevisionRequerida):
            self.consultar()
        self.session.request.assert_called_once()
        self.respuesta.json.assert_not_called()

    def test_429_bloquea_consultas_posteriores_durante_retry_after(self):
        self.respuesta.status_code = 429
        self.respuesta.headers = {"Retry-After": "120"}
        with self.assertRaises(IdentidadLimiteExcedido) as error:
            self.consultar()
        self.assertTrue(error.exception.remoto)
        self.assertEqual(error.exception.reintentar_en, 120)
        with self.assertRaises(IdentidadLimiteExcedido) as siguiente:
            self.consultar()
        self.assertFalse(siguiente.exception.remoto)
        self.assertEqual(siguiente.exception.reintentar_en, 116)
        self.session.request.assert_called_once()

    def test_retry_after_admite_fecha_http_y_valores_invalidos(self):
        from datetime import datetime, timezone
        from email.utils import format_datetime
        fecha = format_datetime(datetime.fromtimestamp(self.reloj.return_value + 120, tz=timezone.utc), usegmt=True)
        self.assertEqual(identidad._retry_after(fecha), 120)
        self.assertEqual(identidad._retry_after("0"), 3)
        for valor in (None, "", "invalido", "-1"):
            self.assertEqual(identidad._retry_after(valor), 60)

    def test_tercera_consulta_del_minuto_se_frena_antes_de_hacer_http(self):
        self.consultar()
        self.consultar()
        with self.assertRaises(IdentidadLimiteExcedido) as error:
            self.consultar()
        self.assertFalse(error.exception.remoto)
        self.assertEqual(error.exception.reintentar_en, 52)
        self.assertEqual(self.session.request.call_count, 2)
        self.reloj.return_value += 48
        self.consultar()  # +4: exactamente 60 segundos desde la primera.
        self.assertEqual(self.session.request.call_count, 3)

    def test_un_404_cuenta_para_la_cuota_y_no_se_reintenta(self):
        self.respuesta.status_code = 404
        with self.assertRaises(IdentidadHTTPError) as error:
            self.consultar()
        self.assertEqual(error.exception.codigo_http, 404)
        self.respuesta.json.assert_not_called()
        self.respuesta.status_code = 200
        self.consultar()
        with self.assertRaises(IdentidadLimiteExcedido):
            self.consultar()
        self.assertEqual(self.session.request.call_count, 2)

    def test_errores_http_no_reintentan_ni_exponen_la_clave(self):
        for codigo in (401, 403, 502, 503, 504, 301, 302, 404, 405):
            self.reloj.return_value += 60  # Probar HTTP sin agotar la cuota local.
            with self.subTest(codigo=codigo), self.assertRaises(IdentidadHTTPError) as error:
                self.respuesta.status_code = codigo
                self.consultar()
            self.assertEqual(error.exception.codigo_http, codigo)
            self.assertNotIn("clave-ficticia", str(error.exception))
        self.assertEqual(self.session.request.call_count, 9)

    def test_fallos_tls_y_conexion_no_desactivan_verificacion(self):
        for fallo in (requests.exceptions.SSLError(), requests.Timeout(), requests.ConnectionError()):
            self.reloj.return_value += 60
            with self.subTest(fallo=type(fallo)), self.assertRaises(ServicioExternoError):
                self.session.request.side_effect = fallo
                self.consultar()
            self.assertEqual(self.session.request.call_args.kwargs["verify"], str(self.certificado))
        self.assertEqual(self.session.request.call_count, 3)

    def test_json_invalido_se_rechaza(self):
        self.respuesta.json.side_effect = ValueError()
        with self.assertRaises(ServicioExternoError):
            self.consultar()
        self.respuesta.json.side_effect = None
        self.respuesta.json.return_value = []
        with self.assertRaises(ServicioExternoError):
            self.consultar()

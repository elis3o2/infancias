from copy import deepcopy
from unittest import TestCase
from unittest.mock import patch

from src.apps.api_externa.services import Digitalizacion as services
from src.apps.api_externa.identidad_types import (
    IdentidadHTTPError, IdentidadLimiteExcedido, IdentidadRespuestaParcial,
    IdentidadRevisionRequerida, ResultadoIdentidad,
)
from src.apps.api_externa.types import (
    RecursoExternoNoEncontrado, ServicioExternoError, ServicioExternoNoConfigurado,
)


class DigitalizacionRespaldoTests(TestCase):
    def setUp(self):
        self.ciudadano = {"nombre": "PRUEBA", "apellido": "FICTICIA", "nroDocumento": 12345678,
                          "sexo": "F", "fechaNacimiento": "2000-01-01"}
        self.datos = {"sisa_data": {"ciudadano": self.ciudadano}, "results_query1": [{"hc": "00100"}]}
        self.datos_rnp = {
            "request_id": "prueba", "estado": "ok",
            "persona": {"estado": "ok", "fuente": "RENAPER", "datos": {
                "dni": "12345678", "sexo": "F", "apellido": "FICTICIA", "nombres": "PRUEBA",
                "fecha_nacimiento": "2000-01-01", "requiere_revision": False,
            }},
            "coberturas": {"estado": "ok", "datos": []},
            "sisros": {"estado": "sin_datos", "datos": None},
        }
        digitalizacion = patch.object(services, "_consultar_api_digitalizacion", return_value=self.datos)
        self.digitalizacion = digitalizacion.start()
        self.addCleanup(digitalizacion.stop)
        identidad = patch.object(services, "consultar_identidad", return_value=ResultadoIdentidad(200, self.datos_rnp))
        self.identidad = identidad.start()
        self.addCleanup(identidad.stop)
        espera = patch.object(services.time, "sleep")
        self.espera = espera.start()
        self.addCleanup(espera.stop)
        red = patch("requests.sessions.Session.request", side_effect=AssertionError("HTTP real prohibido"))
        red.start()
        self.addCleanup(red.stop)

    def consultar(self):
        return services.consultar_digitalizacion("12345678", "F")

    def test_no_consulta_identidad_si_digitalizacion_funciona_incluso_sin_hc(self):
        self.assertEqual(self.consultar(), {**self.ciudadano, "hc": "00100"})
        self.digitalizacion.return_value = {"sisa_data": {"ciudadano": self.ciudadano}, "results_query1": []}
        self.assertEqual(self.consultar(), {**self.ciudadano, "hc": None})
        self.identidad.assert_not_called()

    def test_404_no_es_falla_y_no_activa_respaldo(self):
        self.digitalizacion.side_effect = RecursoExternoNoEncontrado()
        self.assertIsNone(self.consultar())
        self.identidad.assert_not_called()

    def test_fallas_de_digitalizacion_activan_un_solo_respaldo(self):
        for fallo in (ServicioExternoError("HTTP 503"), ServicioExternoError("Conexión"),
                      ServicioExternoError("JSON inválido"), ServicioExternoNoConfigurado()):
            with self.subTest(fallo=fallo):
                self.digitalizacion.side_effect = fallo
                self.identidad.reset_mock()
                self.assertEqual(self.consultar(), {**self.ciudadano, "hc": None})
                self.identidad.assert_called_once_with("12345678", "F", secciones=["renaper", "puco", "sisros"])

    def test_datos_incompletos_activan_respaldo_sin_mezclar_proveedores(self):
        for datos in ({}, {"results_query1": [{"hc": "OTRA-HC"}]}, {"sisa_data": {"ciudadano": {"nombre": "PARCIAL"}}}):
            with self.subTest(datos=datos):
                self.digitalizacion.return_value = datos
                self.assertEqual(self.consultar(), {**self.ciudadano, "hc": None})

    def test_respaldo_no_infiere_hc_de_otros_bloques(self):
        self.digitalizacion.side_effect = ServicioExternoError()
        datos = deepcopy(self.datos_rnp)
        datos["results_query1"] = [{"hc": "200"}]
        datos["sisros"] = {"estado": "ok", "datos": {"hc": "200"}}
        self.identidad.return_value = ResultadoIdentidad(200, datos)
        self.assertEqual(self.consultar(), {**self.ciudadano, "hc": None})

    def test_207_solo_se_acepta_si_persona_esta_verificada(self):
        self.digitalizacion.side_effect = ServicioExternoError()
        self.identidad.return_value = ResultadoIdentidad(207, self.datos_rnp)
        self.assertEqual(self.consultar(), {**self.ciudadano, "hc": None})
        datos = deepcopy(self.datos_rnp)
        datos["persona"] = {"estado": "error", "datos": None}
        self.identidad.return_value = ResultadoIdentidad(207, datos)
        with self.assertRaises(IdentidadRespuestaParcial):
            self.consultar()
        self.identidad.side_effect = IdentidadRevisionRequerida()
        with self.assertRaises(IdentidadRevisionRequerida):
            self.consultar()

    def test_errores_del_respaldo_no_se_transforman_en_persona_inexistente(self):
        self.digitalizacion.side_effect = ServicioExternoError()
        for fallo in (ServicioExternoNoConfigurado(), ServicioExternoError("TLS"), IdentidadHTTPError(401, "Clave"),
                      IdentidadHTTPError(404, "Ruta o recurso no encontrado"),
                      IdentidadLimiteExcedido(3, remoto=True), IdentidadLimiteExcedido(60),
                      IdentidadLimiteExcedido(86400)):
            with self.subTest(fallo=fallo):
                self.identidad.side_effect = fallo
                with self.assertRaises(type(fallo)):
                    self.consultar()
        self.espera.assert_not_called()

    def test_intervalo_local_espera_una_vez_sin_reintentar_peticiones_enviadas(self):
        self.digitalizacion.side_effect = ServicioExternoError()
        self.identidad.side_effect = [IdentidadLimiteExcedido(3), ResultadoIdentidad(200, self.datos_rnp)]
        self.assertEqual(self.consultar(), {**self.ciudadano, "hc": None})
        self.espera.assert_called_once_with(3)
        self.assertEqual(self.identidad.call_count, 2)

    def test_no_hay_bucle_de_esperas(self):
        self.digitalizacion.side_effect = ServicioExternoError()
        self.identidad.side_effect = IdentidadLimiteExcedido(3)
        with self.assertRaises(IdentidadLimiteExcedido):
            self.consultar()
        self.espera.assert_called_once_with(3)
        self.assertEqual(self.identidad.call_count, 2)

    def test_x_excluye_puco(self):
        self.digitalizacion.side_effect = ServicioExternoError()
        datos = deepcopy(self.datos_rnp)
        datos["persona"]["datos"]["sexo"] = "X"
        self.identidad.return_value = ResultadoIdentidad(200, datos)
        self.assertEqual(services.consultar_digitalizacion("12345678", "X")["sexo"], "X")
        self.identidad.assert_called_once_with("12345678", "X", secciones=["renaper", "sisros"])

    def test_no_acepta_respaldo_de_otra_persona_o_con_campos_faltantes(self):
        self.digitalizacion.side_effect = ServicioExternoError()
        for campo, valor in (("sexo", "M"), ("dni", "87654321"), ("nombres", None),
                             ("fecha_nacimiento", "2000-02-30"), ("dni", True), ("requiere_revision", None)):
            with self.subTest(campo=campo):
                datos = deepcopy(self.datos_rnp)
                datos["persona"]["datos"][campo] = valor
                self.identidad.return_value = ResultadoIdentidad(200, datos)
                with self.assertRaises(ServicioExternoError):
                    self.consultar()

    def test_sin_sexo_no_se_consulta_ningun_proveedor(self):
        self.assertIsNone(services.consultar_digitalizacion("12345678", ""))
        self.digitalizacion.assert_not_called()
        self.identidad.assert_not_called()

    def test_varias_personas_del_formulario_pueden_usar_el_respaldo(self):
        from src.apps.persona import services as personas
        from src.apps.persona.services import Consulta as consulta, HistoriaClinica as historia
        self.digitalizacion.side_effect = ServicioExternoError()
        datos_familiar = deepcopy(self.datos_rnp)
        datos_familiar["persona"]["datos"]["dni"] = "87654321"
        self.identidad.side_effect = [ResultadoIdentidad(200, self.datos_rnp), IdentidadLimiteExcedido(3), ResultadoIdentidad(200, datos_familiar)]
        with (
            patch.object(consulta, "buscar_persona", return_value=None),
            patch.object(consulta, "consultar_solicitudes", return_value=[]),
            patch.object(historia, "consultar_hcf", return_value=None) as hcf,
        ):
            resultado = personas.consultar_personas(
                [{"id": 1, "dni": "12345678", "sexo": "F"}],
                [{"id": 2, "dni": "87654321", "sexo": "F"}],
            )
        self.assertEqual(resultado["adolescentes"][0]["ciudadano"]["nroDocumento"], 12345678)
        self.assertEqual(resultado["familiares"][0]["ciudadano"]["nroDocumento"], 87654321)
        self.assertIsNone(resultado["adolescentes"][0]["ciudadano"]["hc"])
        self.assertIsNone(resultado["familiares"][0]["ciudadano"]["hc"])
        self.assertEqual(resultado["hcf"], [])
        hcf.assert_not_called()
        self.espera.assert_called_once_with(3)

    def test_revision_humana_en_bloque_no_se_ignora_aunque_http_sea_200(self):
        self.digitalizacion.side_effect = ServicioExternoError()
        datos = deepcopy(self.datos_rnp)
        datos["persona"]["datos"]["requiere_revision"] = True
        self.identidad.return_value = ResultadoIdentidad(200, datos)
        with self.assertRaises(IdentidadRevisionRequerida):
            self.consultar()

    def test_no_usa_nombres_alternativos_ni_contrato_de_digitalizacion_para_rnp(self):
        self.digitalizacion.side_effect = ServicioExternoError()
        self.identidad.return_value = ResultadoIdentidad(200, self.datos)
        with self.assertRaises(ServicioExternoError):
            self.consultar()
        datos = deepcopy(self.datos_rnp)
        datos["persona"]["datos"]["nombre"] = datos["persona"]["datos"].pop("nombres")
        self.identidad.return_value = ResultadoIdentidad(200, datos)
        with self.assertRaises(ServicioExternoError):
            self.consultar()

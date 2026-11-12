"""HC/HCF del contrato de API_RNP, con datos ficticios y sin llamadas reales."""
from copy import deepcopy
from unittest.mock import patch

from django.test import SimpleTestCase

from src.apps.api_externa.identidad_normalizacion import normalizar_identidad
from src.apps.api_externa.identidad_types import ResultadoIdentidad
from src.apps.api_externa.services import Digitalizacion
from src.apps.api_externa.types import ServicioExternoError
from src.apps.persona.services import consultar_personas
from src.apps.persona.services import Consulta, HistoriaClinica


class IdentidadHistoriasTests(SimpleTestCase):
    def setUp(self):
        self.datos = {
            "estado": "ok",
            "persona": {"estado": "ok", "datos": {
                "dni": "12345678", "sexo": "F", "nombres": "PERSONA", "apellido": "PRUEBA",
                "fecha_nacimiento": "2000-01-01", "requiere_revision": False,
            }},
            "sisros": {
                "estado": "ok", "match": {"estado": "VALIDADO_EXACTO", "vinculado": True},
                "datos": {"numero_hci": 173715, "numero_hcf": 3656,
                          "nombre": "NO USAR", "apellido": "NO USAR", "fecha_nacimiento": "1900-01-01"},
            },
        }
        red = patch("requests.sessions.Session.request", side_effect=AssertionError("HTTP real prohibido"))
        red.start()
        self.addCleanup(red.stop)

    def normalizar(self, datos=None, codigo=200):
        return normalizar_identidad(ResultadoIdentidad(codigo, datos or self.datos), "12345678", "F")

    def consultar(self, respuesta_hcf):
        with (
            patch.object(Digitalizacion, "_consultar_api_digitalizacion", side_effect=ServicioExternoError()),
            patch.object(Digitalizacion, "consultar_identidad", return_value=ResultadoIdentidad(200, self.datos)) as identidad,
            patch.object(Consulta, "buscar_persona", return_value=None),
            patch.object(Consulta, "consultar_solicitudes", return_value=[]),
            patch.object(HistoriaClinica, "consultar_hcf", return_value=respuesta_hcf) as hcf,
        ):
            respuesta = consultar_personas([{"id": 1, "dni": "12345678", "sexo": "F"}], [])
        identidad.assert_called_once_with("12345678", "F", secciones=["renaper", "puco", "sisros"])
        return respuesta, hcf

    def test_extrae_hci_y_hcf_sin_reemplazar_identidad_renaper(self):
        for codigo in (200, 207):
            with self.subTest(codigo=codigo):
                self.assertEqual(self.normalizar(codigo=codigo), {
                    "nombre": "PERSONA", "apellido": "PRUEBA", "nroDocumento": 12345678,
                    "sexo": "F", "fechaNacimiento": "2000-01-01", "hc": "173715", "hcf": "3656",
                })

    def test_no_asigna_historias_sin_datos_o_sin_vinculacion_validada(self):
        for cambios in (
            {"estado": "sin_datos"}, {"estado": "error"}, {"datos": None}, {"datos": []},
            {"match": None}, {"match": {}},
            {"match": {"estado": "VALIDADO_EXACTO", "vinculado": False}},
            {"match": {"estado": "VALIDADO_EXACTO", "vinculado": 1}},
            {"match": {"estado": "REQUIERE_REVISION", "vinculado": True}},
        ):
            with self.subTest(cambios=cambios):
                datos = deepcopy(self.datos)
                datos["sisros"].update(cambios)
                resultado = self.normalizar(datos)
                self.assertIsNone(resultado["hc"])
                self.assertNotIn("hcf", resultado)
                self.assertEqual(resultado["nombre"], "PERSONA")
        for bloque in (None, [], "incorrecto"):
            datos = deepcopy(self.datos)
            datos["sisros"] = bloque
            self.assertIsNone(self.normalizar(datos)["hc"])

    def test_historias_solo_aceptan_enteros_positivos_y_son_independientes(self):
        for campo, destino, otro in (("numero_hci", "hc", "hcf"), ("numero_hcf", "hcf", "hc")):
            for valor in (None, 0, -1, True, False, 17.5, "173715", "", [], {}):
                with self.subTest(campo=campo, valor=valor):
                    datos = deepcopy(self.datos)
                    datos["sisros"]["datos"][campo] = valor
                    resultado = self.normalizar(datos)
                    self.assertIsNone(resultado.get(destino))
                    self.assertIsNotNone(resultado.get(otro))

    def test_no_busca_historias_en_campos_o_bloques_alternativos(self):
        datos = deepcopy(self.datos)
        datos["sisros"]["datos"] = {"hc": 111, "hcf": 222, "numeroHCI": 333}
        datos["persona"]["datos"].update(numero_hci=444, numero_hcf=555)
        datos["results_query1"] = [{"hc": "666"}]
        resultado = self.normalizar(datos)
        self.assertIsNone(resultado["hc"])
        self.assertNotIn("hcf", resultado)

    @staticmethod
    def integrante(hc, dni):
        return {
            "idPersona": hc, "numeroHCI": hc, "DNI": dni, "sexo": "F",
            "nombre": "PERSONA", "apellido": "PRUEBA", "fechaNacimiento": "2000-01-01",
            "flag_discapacidades": 1, "flag_consumos_problematicos": 0,
            "flag_intentos_de_suicidio": 0, "flag_problemas_socioambientales": 0,
            "flag_violencias": 0,
        }

    def test_consulta_integrantes_con_hci_no_con_hcf(self):
        respuesta, consulta_hcf = self.consultar({"hcf": "3656", "resultados": [
            self.integrante(173715, "12345678"), self.integrante(200000, "87654321"),
        ]})
        consulta_hcf.assert_called_once_with("173715")
        persona = respuesta["adolescentes"][0]["ciudadano"]
        self.assertEqual((persona["hc"], persona["hcf"]), ("173715", "3656"))
        self.assertEqual(persona["discapacidades"], 1)
        self.assertEqual(len(respuesta["hcf"]), 1)
        self.assertEqual(respuesta["hcf"][0]["numeroHCI"], 200000)
        self.assertEqual(respuesta["hcf"][0]["hcf"], "3656")

    def test_conserva_los_numeros_si_api_hcf_no_aporta_la_historia_familiar(self):
        for respuesta_hcf in (None, {"hcf": "", "resultados": [self.integrante(173715, "12345678")]}):
            with self.subTest(respuesta_hcf=respuesta_hcf):
                respuesta, consulta_hcf = self.consultar(respuesta_hcf)
                consulta_hcf.assert_called_once_with("173715")
                persona = respuesta["adolescentes"][0]["ciudadano"]
                self.assertEqual((persona["hc"], persona["hcf"]), ("173715", "3656"))
                if respuesta_hcf is None:
                    self.assertNotIn("discapacidades", persona)

    def test_solo_hcf_no_se_utiliza_como_hci_para_buscar_integrantes(self):
        self.datos["sisros"]["datos"]["numero_hci"] = None
        respuesta, consulta_hcf = self.consultar(None)
        persona = respuesta["adolescentes"][0]["ciudadano"]
        self.assertIsNone(persona["hc"])
        self.assertEqual(persona["hcf"], "3656")
        consulta_hcf.assert_not_called()

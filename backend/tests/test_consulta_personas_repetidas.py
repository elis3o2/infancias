from unittest.mock import patch

from django.test import SimpleTestCase

from src.apps.api_externa.types import DatosDigitalizacion
from src.apps.persona.services import consultar_personas
from src.apps.persona.services import Consulta as consulta
from src.apps.persona.services import HistoriaClinica as historia


class ConsultaPersonasRepetidasTests(SimpleTestCase):
    def setUp(self):
        self.ciudadano: DatosDigitalizacion = {
            "nombre": "Prueba", "apellido": "Ficticia", "nroDocumento": 12345678,
            "sexo": "F", "fechaNacimiento": "2000-01-01", "hc": None,
        }
        for nombre, resultado in (("buscar_persona", None), ("consultar_solicitudes", [])):
            simulacion = patch.object(consulta, nombre, return_value=resultado)
            simulacion.start()
            self.addCleanup(simulacion.stop)
        proveedor = patch.object(consulta, "consultar_digitalizacion", return_value=self.ciudadano)
        self.proveedor = proveedor.start()
        self.addCleanup(proveedor.stop)
        hcf = patch.object(historia, "consultar_hcf", return_value=None)
        hcf.start()
        self.addCleanup(hcf.stop)

    def persona(self, id, sexo="F"):
        return {"id": id, "dni": "12345678", "sexo": sexo}

    def test_familiar_compartido_se_consulta_una_vez_y_conserva_cada_id(self):
        respuesta = consultar_personas([], [self.persona(10), self.persona(20)])
        self.proveedor.assert_called_once_with(dni="12345678", sexo="F")
        self.assertEqual([item["id"] for item in respuesta["familiares"]], [10, 20])
        primero, segundo = [item["ciudadano"] for item in respuesta["familiares"]]
        self.assertEqual(primero, self.ciudadano)
        self.assertEqual(segundo, self.ciudadano)
        self.assertIsNot(primero, segundo)
        self.assertIsNot(primero, self.ciudadano)

    def test_reutiliza_identidad_entre_adolescente_y_familiar(self):
        respuesta = consultar_personas([self.persona(1)], [self.persona(2)])
        self.proveedor.assert_called_once()
        self.assertEqual(respuesta["adolescentes"][0]["id"], 1)
        self.assertEqual(respuesta["familiares"][0]["id"], 2)

    def test_mismo_dni_con_distinto_sexo_no_se_reutiliza(self):
        consultar_personas([], [self.persona(1), self.persona(2, "M")])
        self.assertEqual(self.proveedor.call_count, 2)

    def test_no_persiste_respuestas_entre_busquedas(self):
        consultar_personas([], [self.persona(1)])
        consultar_personas([], [self.persona(1)])
        self.assertEqual(self.proveedor.call_count, 2)

    def test_resultado_sin_persona_tampoco_se_consulta_dos_veces(self):
        self.proveedor.return_value = None
        respuesta = consultar_personas([], [self.persona(1), self.persona(2)])
        self.proveedor.assert_called_once()
        self.assertTrue(all(item["ciudadano"] is None for item in respuesta["familiares"]))

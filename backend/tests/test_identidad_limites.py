import json
import multiprocessing
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

from src.apps.api_externa.identidad_limites import limitar_consulta
from src.apps.api_externa.identidad_types import IdentidadLimiteExcedido
from src.apps.api_externa.types import ServicioExternoError


def _consultar_desde_otro_proceso(archivo: str) -> None:
    try:
        with limitar_consulta(Path(archivo)):
            pass
    except IdentidadLimiteExcedido:
        return
    raise AssertionError("El otro proceso pudo consultar mientras había una consulta activa")


class LimitesIdentidadTests(TestCase):
    def setUp(self):
        temporal = TemporaryDirectory()
        self.addCleanup(temporal.cleanup)
        self.archivo = Path(temporal.name) / "limites.json"
        reloj = patch("src.apps.api_externa.identidad_limites.time.time", return_value=200000.0)
        self.reloj = reloj.start()
        self.addCleanup(reloj.stop)

    def test_intervalo_persistente_de_tres_segundos(self):
        with limitar_consulta(self.archivo):
            pass
        self.reloj.return_value += 2
        with self.assertRaises(IdentidadLimiteExcedido) as error:
            with limitar_consulta(Path(str(self.archivo))):
                self.fail("No debe consultar")
        self.assertEqual(error.exception.reintentar_en, 1)
        self.reloj.return_value += 1
        with limitar_consulta(self.archivo):
            pass

    def test_consulta_lenta_y_fallida_tambien_consume_cupo(self):
        with self.assertRaises(RuntimeError):
            with limitar_consulta(self.archivo):
                self.reloj.return_value += 10
                raise RuntimeError("Fallo simulado")
        with self.assertRaises(IdentidadLimiteExcedido) as error:
            with limitar_consulta(self.archivo):
                pass
        self.assertEqual(error.exception.reintentar_en, 3)
        self.assertEqual(len(json.loads(self.archivo.read_text())["consultas"]), 1)

    def test_las_consultas_simultaneas_no_se_aceptan(self):
        with limitar_consulta(self.archivo):
            with self.assertRaises(IdentidadLimiteExcedido):
                with limitar_consulta(self.archivo):
                    self.fail("No debe haber dos consultas activas")

    def test_el_bloqueo_es_compartido_entre_procesos(self):
        with limitar_consulta(self.archivo):
            proceso = multiprocessing.get_context("spawn").Process(
                target=_consultar_desde_otro_proceso, args=(str(self.archivo),),
            )
            proceso.start()
            try:
                proceso.join(timeout=10)
                self.assertEqual(proceso.exitcode, 0)
            finally:
                if proceso.is_alive():
                    proceso.terminate()
                    proceso.join(timeout=5)

    def test_maximo_veinte_por_minuto(self):
        self.archivo.write_text(json.dumps({"consultas": [199941.0 + indice * 2.8 for indice in range(20)], "bloqueado_hasta": 0}))
        with self.assertRaises(IdentidadLimiteExcedido) as error:
            with limitar_consulta(self.archivo):
                pass
        self.assertEqual(error.exception.reintentar_en, 1)

    def test_maximo_diez_mil_en_veinticuatro_horas(self):
        consultas = [113601.0 + indice * 8 for indice in range(10000)]
        self.archivo.write_text(json.dumps({"consultas": consultas, "bloqueado_hasta": 0}))
        with self.assertRaises(IdentidadLimiteExcedido) as error:
            with limitar_consulta(self.archivo):
                pass
        self.assertEqual(error.exception.reintentar_en, 1)
        self.reloj.return_value += 1
        with limitar_consulta(self.archivo):
            pass
        self.assertEqual(len(json.loads(self.archivo.read_text())["consultas"]), 10000)

    def test_estado_danado_no_se_reinicia_para_evitar_el_limite(self):
        for contenido in ("", "invalido", "[]", '{"consultas": [true], "bloqueado_hasta": 0}', '{"consultas": [], "bloqueado_hasta": NaN}'):
            with self.subTest(contenido=contenido):
                self.archivo.write_text(contenido)
                with self.assertRaises(ServicioExternoError):
                    with limitar_consulta(self.archivo):
                        self.fail("No debe continuar sin controlar la cuota")
                self.assertEqual(self.archivo.read_text(), contenido)

    def test_estado_no_escribible_no_permite_consultar(self):
        with patch("src.apps.api_externa.identidad_limites.os.replace", side_effect=PermissionError()):
            with self.assertRaises(ServicioExternoError):
                with limitar_consulta(self.archivo):
                    self.fail("No debe consultar sin guardar la reserva")


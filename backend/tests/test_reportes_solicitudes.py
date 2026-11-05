from datetime import date, datetime, timezone as datetime_timezone
from unittest.mock import patch

from django.apps import apps
from django.db import connection
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from src.models import Equipo, Usuario
from src.apps.persona.models import Adolescente
from src.apps.solicitud.models import MotivoSolicitud, Solicitud, SolicitudComentario
from src.apps.solicitud.reportes import fecha_actual, periodo_reporte


@override_settings(ROOT_URLCONF="src.apps.solicitud.urls")
class ReportesSolicitudTests(TestCase):
    @classmethod
    def setUpClass(cls):
        if connection.vendor != "sqlite" or "memory" not in connection.settings_dict["NAME"]:
            raise RuntimeError("Estas pruebas solo pueden usar SQLite en memoria.")
        cls.modelos_externos = [modelo for modelo in apps.get_models() if not modelo._meta.managed]
        with connection.schema_editor() as editor:
            for modelo in cls.modelos_externos:
                editor.create_model(modelo)
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        with connection.schema_editor() as editor:
            for modelo in reversed(cls.modelos_externos):
                editor.delete_model(modelo)

    def setUp(self):
        reloj = patch("src.apps.solicitud.reportes_views.fecha_actual", return_value=date(2026, 10, 7))
        reloj.start()
        self.addCleanup(reloj.stop)
        red = patch("requests.sessions.Session.request", side_effect=AssertionError("No debe consultar APIs externas"))
        red.start()
        self.addCleanup(red.stop)
        self.entrada = Equipo.objects.create(nombre="Entrada")
        self.admision = Equipo.objects.create(nombre="Admisión")
        self.territorial = Equipo.objects.create(nombre="Territorial")
        self.vacio = Equipo.objects.create(nombre="Sin solicitudes")
        self.usuario = Usuario.objects.create(username="operador", equipo=self.entrada)
        self.client = APIClient()
        self.client.force_authenticate(self.usuario)
        self.motivo = MotivoSolicitud.objects.create(nombre="Consulta")
        self.otro_motivo = MotivoSolicitud.objects.create(nombre="Acompañamiento")
        self.anterior = self._solicitud("2026-10-04T23:59:59.999999", self.entrada)
        self.lunes = self._solicitud("2026-10-05T00:00:00", self.entrada)
        self.miercoles = self._solicitud("2026-10-07T10:00:00", self.admision, validado=True)
        self.domingo = self._solicitud("2026-10-11T23:59:59.999999", self.territorial, rechazado=True, motivo=self.otro_motivo)
        self.siguiente = self._solicitud("2026-10-12T00:00:00", self.territorial, validado=True)
        for indice in range(3):
            Adolescente.objects.create(solicitud=self.lunes, nombre="Niño", apellido="Prueba", dni=str(50000000 + indice), sexo="M", fecha_nacimiento=date(2012, 1, 1))
        for solicitud in (self.lunes, self.lunes, self.anterior):
            SolicitudComentario.objects.create(solicitud=solicitud, usuario=self.usuario, comentario="Seguimiento",
                fecha_hora_creacion=datetime(2026, 10, 15), fecha_hora_ultmod=datetime(2026, 10, 15))

    def _solicitud(self, fecha, equipo, **cambios):
        return Solicitud.objects.create(fecha_hora_creacion=datetime.fromisoformat(fecha), equipo=equipo,
            **{"motivo": self.motivo, "correo": "", "telefono": "", "validado": False, "rechazado": False, **cambios})

    def _reporte(self, **filtros):
        respuesta = self.client.get("/reportes/", filtros)
        self.assertEqual(respuesta.status_code, 200, respuesta.data)
        return respuesta.json()

    def test_semana_lunes_a_domingo_por_creacion_y_no_por_pase(self):
        self.anterior.fecha_hora_entrada = datetime(2026, 10, 7)
        self.anterior.save(update_fields=["fecha_hora_entrada"])
        reporte = self._reporte()
        self.assertEqual(reporte["periodo"], {"desde": "2026-10-05", "hasta": "2026-10-11"})
        self.assertEqual(reporte["general"]["total"], 5)
        self.assertEqual(reporte["general"]["ingresadas_semana"], 3)
        self.assertEqual(reporte["general"]["pendientes"], 2)
        self.assertEqual([item["id"] for item in reporte["solicitudes"]["results"]], [self.domingo.pk, self.miercoles.pk, self.lunes.pk])

    def test_totales_sin_multiplicar_por_adolescentes_o_comentarios(self):
        reporte = self._reporte()
        self.assertEqual(reporte["resumen"], {"total": 3, "pendientes": 1, "validadas": 1, "rechazadas": 1, "intervenciones": 2,
            "motivos": [{"motivo__nombre": "Consulta", "total": 2}, {"motivo__nombre": "Acompañamiento", "total": 1}]})
        lunes = reporte["solicitudes"]["results"][-1]
        self.assertEqual(lunes["cantidad_adolescentes"], 3)
        self.assertEqual(lunes["cantidad_comentarios"], 2)
        self.assertNotIn("correo", lunes)
        self.assertNotIn("descripcion", lunes)

    def test_equipos_muestran_ubicacion_actual_incluyen_cero_y_no_filtran_por_usuario(self):
        general = self._reporte()["general"]
        self.assertEqual({item["nombre"]: item["total"] for item in general["equipos"]},
            {"Entrada": 2, "Admisión": 1, "Territorial": 1, "Sin solicitudes": 0, "Rechazadas": 1})
        self.lunes.equipo = self.admision
        self.lunes.save(update_fields=["equipo"])
        reporte = self._reporte(periodo="todo", solicitud=self.lunes.pk)
        self.assertEqual(reporte["solicitudes"]["results"][0]["equipo"], "Admisión")
        equipos = {item["nombre"]: item["total"] for item in reporte["general"]["equipos"]}
        self.assertEqual((equipos["Entrada"], equipos["Admisión"]), (1, 2))

    def test_rechazadas_son_un_grupo_virtual_sin_cambiar_el_equipo_guardado(self):
        reporte = self._reporte(periodo="todo", equipo="rechazadas")
        self.assertEqual(reporte["resumen"]["total"], 1)
        self.assertEqual(reporte["solicitudes"]["results"][0]["id"], self.domingo.pk)
        self.assertEqual(reporte["solicitudes"]["results"][0]["equipo"], "Rechazadas")
        self.domingo.refresh_from_db()
        self.assertEqual(self.domingo.equipo_id, self.territorial.pk)
        self.assertFalse(Equipo.objects.filter(nombre="Rechazadas").exists())
        grupos = reporte["general"]["equipos"]
        self.assertEqual(sum(grupo["total"] for grupo in grupos), reporte["general"]["total"])
        territorial = self._reporte(periodo="todo", equipo=self.territorial.pk)
        self.assertEqual([item["id"] for item in territorial["solicitudes"]["results"]], [self.siguiente.pk])
        self.assertEqual(self._reporte(equipo=self.territorial.pk, estado="rechazada")["resumen"]["total"], 0)
        self.assertEqual(self._reporte(equipo="rechazadas", estado="validada")["resumen"]["total"], 0)

    def test_filtros_se_combinan_sin_alterar_panorama_general(self):
        reporte = self._reporte(periodo="todo", equipo=self.territorial.pk, estado="validada")
        self.assertEqual(reporte["resumen"]["total"], 1)
        self.assertEqual(reporte["solicitudes"]["results"][0]["id"], self.siguiente.pk)
        self.assertEqual(reporte["general"], self._reporte()["general"])
        vacio = self._reporte(periodo="todo", equipo=self.territorial.pk, solicitud=self.lunes.pk)
        self.assertEqual(vacio["resumen"]["total"], 0)
        self.assertEqual(vacio["resumen"]["intervenciones"], 0)
        self.assertEqual(vacio["resumen"]["motivos"], [])

    def test_estados_excluyentes_aun_si_ambas_banderas_estan_activas(self):
        self.domingo.validado = True
        self.domingo.save(update_fields=["validado"])
        resumen = self._reporte()["resumen"]
        self.assertEqual(resumen["total"], resumen["pendientes"] + resumen["validadas"] + resumen["rechazadas"])
        for estado, solicitud in (("pendiente", self.lunes), ("validada", self.miercoles), ("rechazada", self.domingo)):
            datos = self._reporte(estado=estado)
            self.assertEqual([item["id"] for item in datos["solicitudes"]["results"]], [solicitud.pk])

    def test_periodo_personalizado_incluye_dia_completo_y_mes(self):
        datos = self._reporte(periodo="personalizado", desde="2026-10-11", hasta="2026-10-11")
        self.assertEqual([item["id"] for item in datos["solicitudes"]["results"]], [self.domingo.pk])
        mes = self._reporte(periodo="mes")
        self.assertEqual(mes["periodo"], {"desde": "2026-10-01", "hasta": "2026-10-31"})
        self.assertEqual(mes["resumen"]["total"], 5)
        self.assertEqual(periodo_reporte({"periodo": "mes"}, date(2024, 2, 29)), (date(2024, 2, 1), date(2024, 2, 29)))
        self.assertEqual(periodo_reporte({"periodo": "semana"}, date(2027, 1, 1)), (date(2026, 12, 28), date(2027, 1, 3)))

    def test_paginacion_no_limita_los_indicadores(self):
        for _ in range(21):
            self._solicitud("2026-10-06T10:00:00", self.entrada)
        primera = self._reporte()
        segunda = self._reporte(page=2)
        self.assertEqual(primera["resumen"]["total"], 24)
        self.assertEqual(primera["resumen"], segunda["resumen"])
        self.assertEqual(len(primera["solicitudes"]["results"]), 20)
        self.assertEqual(len(segunda["solicitudes"]["results"]), 4)
        self.assertEqual(segunda["solicitudes"]["pagina"], 2)
        self.assertEqual(self._reporte(page="last")["solicitudes"]["pagina"], 2)
        self.assertIsNotNone(primera["solicitudes"]["next"])
        self.assertIsNone(segunda["solicitudes"]["next"])
        self.assertFalse({s["id"] for s in primera["solicitudes"]["results"]} & {s["id"] for s in segunda["solicitudes"]["results"]})

    def test_parametros_invalidos_y_pagina_inexistente(self):
        for filtros in ({"periodo": "otro"}, {"desde": "2026-10-01"}, {"periodo": "personalizado"},
                        {"periodo": "personalizado", "desde": "2026-10-11", "hasta": "2026-10-01"},
                        {"periodo": "personalizado", "desde": "2026-10-01", "hasta": "9999-12-31"},
                        {"estado": "otro"}, {"equipo": -1}, {"solicitud": "abc"}):
            with self.subTest(filtros=filtros):
                self.assertEqual(self.client.get("/reportes/", filtros).status_code, 400)
        self.assertEqual(self.client.get("/reportes/", {"page": 999}).status_code, 404)

    def test_solo_lectura_y_solo_usuarios_operativos(self):
        for metodo in ("post", "put", "patch", "delete"):
            self.assertEqual(getattr(self.client, metodo)("/reportes/", {}, format="json").status_code, 405)
        self.assertEqual(Solicitud.objects.count(), 5)
        for equipo in (None, self.vacio):
            usuario = Usuario.objects.create(username=f"ajeno-{equipo}", equipo=equipo)
            self.client.force_authenticate(usuario)
            self.assertEqual(self.client.get("/reportes/").status_code, 403)
        self.assertIn(APIClient().get("/reportes/").status_code, (401, 403))

    @override_settings(USE_TZ=True, TIME_ZONE="America/Argentina/Buenos_Aires")
    def test_fecha_actual_usa_zona_local_si_se_activa_timezone(self):
        with patch("src.apps.solicitud.reportes.timezone.now", return_value=datetime(2026, 10, 5, 1, tzinfo=datetime_timezone.utc)):
            self.assertEqual(fecha_actual(), date(2026, 10, 4))

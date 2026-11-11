from datetime import date
from types import SimpleNamespace
from unittest.mock import call, patch

from django.test import SimpleTestCase

from src.apps.api_externa.types import HCFResultado
from src.apps.persona import services
from src.apps.persona.services import Consulta as consulta, HistoriaClinica as historia, Persona as personas
from src.apps.persona.models import Persona
from src.apps.persona.serializers import ConsultaPersonasSerializer, SaludDatosSerializer, PersonaValidateSerializer


def integrante(hc: int, dni: str, sexo: str = "M") -> HCFResultado:
    return {
        "idPersona": hc, "DNI": dni, "numeroHCI": hc,
        "apellido": "Prueba", "nombre": "Integrante", "sexo": sexo,
        "fechaNacimiento": "2008-02-18", "codigoCalle": 1,
        "nombreCalle": "Calle de prueba", "numCalle": "100",
        "coordXPacienteUltimaAtencion": 0.0, "coordYPacienteUltimaAtencion": 0.0,
        "fecha_insert": "2026-01-01", "fechaFallecido": None, "fallecido": 0,
        "validated_at": "2026-01-01", "latitud_wgs84": 0.0, "longitud_wgs84": 0.0,
        "flag_discapacidades": 1, "flag_consumos_problematicos": 0,
        "flag_intentos_de_suicidio": 0, "flag_problemas_socioambientales": 1,
        "flag_violencias": 1,
    }


class ConsultaPersonasTests(SimpleTestCase):
    """Sin base de datos: consultas locales y proveedores simulados."""

    def setUp(self):
        red = patch("requests.sessions.Session.request", side_effect=AssertionError("HTTP real prohibido"))
        red.start()
        self.addCleanup(red.stop)

    def test_agrupa_por_hcf_sin_reconsultar_integrantes_ya_encontrados(self):
        adolescentes = [{"id": 1, "dni": "50000001", "sexo": "M"},
                        {"id": 2, "dni": "50000002", "sexo": "F"}]
        familiares = [{"id": 3, "dni": "30000001", "sexo": "M"}]
        adicionales = [integrante(400, "30000002"), integrante(500, "30000003")]
        respuestas = [
            {"hcf": "50", "resultados": [integrante(100, "50000001"),
                                          integrante(200, "50000002", "F"), adicionales[0]]},
            {"hcf": "60", "resultados": [integrante(300, "30000001"), adicionales[1]]},
        ]
        with (
            patch.object(historia, "consultar_adolescente", side_effect=[
                {"id": 1, "persona": None, "ciudadano": {"hc": "100"}},
                {"id": 2, "persona": {"hc": 200, "hcf": 50}, "ciudadano": None},
            ]),
            patch.object(historia, "consultar_familiar", return_value={
                "id": 3, "persona": None, "ciudadano": {"hc": "300"},
            }),
            patch.object(historia, "consultar_hcf", side_effect=respuestas) as consultar,
        ):
            resultado = services.consultar_personas(adolescentes, familiares)

        self.assertEqual(consultar.call_args_list, [call("100"), call("300")])
        self.assertEqual(resultado["hcf"], [
            {**adicionales[0], "hcf": "50"}, {**adicionales[1], "hcf": "60"},
        ])
        for item, origen, hc, hcf in (
            (resultado["adolescentes"][0], "ciudadano", "100", "50"),
            (resultado["adolescentes"][1], "persona", 200, "50"),
            (resultado["familiares"][0], "ciudadano", "300", "60"),
        ):
            self.assertEqual(item[origen]["hc"], hc)
            self.assertEqual(item[origen]["hcf"], hcf)
            self.assertEqual(item[origen]["violencias"], 1)
            self.assertEqual(item[origen]["discapacidades"], 1)

    def test_no_usa_hcf_como_hc_ni_pierde_salud_local_si_no_hay_resultados(self):
        for hc in (None, 100):
            with self.subTest(hc=hc):
                datos = {"hc": hc, "hcf": 50, "violencias": True}
                with (
                    patch.object(historia, "consultar_adolescente", return_value={"persona": datos.copy()}),
                    patch.object(historia, "consultar_hcf", return_value=None) as consultar,
                ):
                    resultado = services.consultar_personas([{"dni": "50000001", "sexo": "M"}], [])
                self.assertEqual(resultado["adolescentes"][0]["persona"], datos)
                self.assertEqual(resultado["hcf"], [])
                self.assertEqual(consultar.call_args_list, [] if hc is None else [call("100")])

    def test_no_duplica_hc_consultadas_o_integrantes_adicionales(self):
        adicional = integrante(400, "30000002")
        with (
            patch.object(historia, "consultar_adolescente", side_effect=[
                {"persona": {"hc": 100}}, {"ciudadano": {"hc": "100"}},
                {"ciudadano": {"hc": "300"}},
            ]),
            patch.object(historia, "consultar_hcf", side_effect=[
                {"hcf": "50", "resultados": [adicional]},
                {"hcf": "50", "resultados": [adicional]},
            ]) as consultar,
        ):
            resultado = services.consultar_personas([
                {"dni": "50000001", "sexo": "M"}, {"dni": "50000001", "sexo": "M"},
                {"dni": "30000001", "sexo": "M"},
            ], [])
        self.assertEqual(consultar.call_args_list, [call("100"), call("300")])
        self.assertEqual(resultado["hcf"], [{**adicional, "hcf": "50"}])

    def test_persona_original_sin_sexo_no_se_repite_como_adicional_si_coincide_hc(self):
        with (
            patch.object(historia, "consultar_adolescente", return_value={"persona": {"hc": 100}}),
            patch.object(historia, "consultar_hcf", return_value={
                "hcf": "50", "resultados": [integrante(100, "50000001")],
            }),
        ):
            resultado = services.consultar_personas([{"dni": "50000001", "sexo": None}], [])
        self.assertEqual(resultado["hcf"], [])

    def test_persona_local_expone_hc_y_hcf_sin_consultar_digitalizacion(self):
        persona = Persona(
            dni="50000001", sexo="M", nombre="Nombre", apellido="Prueba",
            fecha_nacimiento=date(2008, 2, 18), hc=100, hcf=50, violencias=True,
        )
        with (
            patch.object(consulta, "buscar_persona", return_value=persona),
            patch.object(consulta, "consultar_relaciones", return_value=[]),
            patch.object(consulta, "consultar_solicitudes", return_value=[]),
            patch.object(consulta, "consultar_digitalizacion") as consultar,
        ):
            resultado = services.consultar_adolescente({"id": 1, "dni": persona.dni, "sexo": persona.sexo})
        consultar.assert_not_called()
        self.assertEqual(resultado["persona"]["hc"], 100)
        self.assertEqual(resultado["persona"]["hcf"], 50)
        self.assertTrue(resultado["persona"]["violencias"])

    def test_solicitudes_no_se_filtran_por_equipo(self):
        persona = Persona(id=1)
        registros = [SimpleNamespace(
            id=equipo, fecha_hora_creacion=None, equipo_id=equipo,
            equipo=SimpleNamespace(nombre=f"Equipo {equipo}"), motivo_id=None,
        ) for equipo in (1, 2)]
        with patch.object(consulta.Solicitud.objects, "filter") as filtrar:
            filtrar.return_value.select_related.return_value.distinct.return_value = registros
            resultado = services.consultar_solicitudes(persona)
        filtrar.assert_called_once_with(adolescentes__persona=persona, rechazado=False)
        self.assertEqual([solicitud["id"] for solicitud in resultado], [1, 2])

    def test_consulta_sin_familiares_y_sin_campos_innecesarios(self):
        serializer = ConsultaPersonasSerializer(data={"adolescentes": []})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(set(serializer.fields), {"adolescentes", "familiares"})
        self.assertEqual(set(serializer.fields["adolescentes"].child.fields), {"id", "dni", "sexo"})
        self.assertEqual(services.consultar_personas(**serializer.validated_data), {
            "adolescentes": [], "familiares": [], "hcf": [],
        })

    def test_salud_acepta_hc_y_hcf_independientes_y_nullable(self):
        for datos in ({"hc": 100, "hcf": 50}, {"hc": None, "hcf": None}, {}):
            with self.subTest(datos=datos):
                serializer = SaludDatosSerializer(data=datos)
                self.assertTrue(serializer.is_valid(), serializer.errors)
                self.assertEqual(serializer.validated_data, datos)
        campo = Persona._meta.get_field("hc")
        self.assertEqual(campo.get_internal_type(), "IntegerField")
        self.assertTrue(campo.null)

    def test_actualiza_hc_y_hcf_sin_confundirlos(self):
        persona = Persona(hc=100, hcf=50)
        with patch.object(persona, "save") as guardar:
            personas._actualizar_salud(persona, {"hc": 200, "hcf": 60})
        self.assertEqual((persona.hc, persona.hcf), (200, 60))
        guardar.assert_called_once_with(update_fields=["hc", "hcf"])

    def test_creacion_no_asigna_false_a_hc_ni_hcf(self):
        identidad = {"nombre": "Nombre", "apellido": "Prueba", "dni": "50000001",
                     "sexo": "M", "fecha_nacimiento": date(2008, 2, 18)}
        for salud in ({}, {"hc": 100, "hcf": 50}):
            with (
                self.subTest(salud=salud),
                patch.object(Persona.objects, "create", side_effect=Persona) as crear,
            ):
                persona = personas._crear_persona_validada({**identidad, **salud})
                self.assertEqual(persona.hc, salud.get("hc"))
                self.assertEqual(persona.hcf, salud.get("hcf"))
                self.assertFalse(persona.discapacidades)
                if not salud:
                    self.assertNotIn("hc", crear.call_args.kwargs)
                    self.assertNotIn("hcf", crear.call_args.kwargs)

    def test_persona_completa_requiere_identidad_y_valida_salud(self):
        datos = {"nombre": "Nombre", "apellido": "Prueba", "dni": "50000001",
                 "sexo": "M", "fecha_nacimiento": "2008-02-18", "hc": 100, "hcf": 50,
                 "discapacidades": True, "consumos_problematicos": False,
                 "intentos_de_suicidio": False, "problemas_socioambientales": True, "violencias": False}
        serializer = PersonaValidateSerializer(data=datos)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["fecha_nacimiento"], date(2008, 2, 18))
        self.assertEqual(set(serializer.fields), set(datos))
        for campo in ("nombre", "apellido", "dni", "sexo", "fecha_nacimiento"):
            incompleto = datos.copy()
            incompleto.pop(campo)
            serializer = PersonaValidateSerializer(data=incompleto)
            self.assertFalse(serializer.is_valid(), campo)

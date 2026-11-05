from django.apps import apps
from django.db import connection
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from src.apps.domicilio.models import Departamento, Domicilio, Provincia
from src.apps.domicilio.serializers import DomicilioSerializer
from src.apps.domicilio.services import crear_domicilio
from src.apps.persona.serializers import FamiliarCreateSerializer


@override_settings(ROOT_URLCONF="src.apps.domicilio.urls")
class DomicilioFamiliarTests(TestCase):
    @classmethod
    def setUpClass(cls):
        if connection.vendor != "sqlite" or "memory" not in connection.settings_dict["NAME"]:
            raise RuntimeError("Estas pruebas solo pueden usar SQLite en memoria.")
        cls.modelos = [modelo for modelo in apps.get_models() if not modelo._meta.managed]
        with connection.schema_editor() as editor:
            for modelo in cls.modelos:
                editor.create_model(modelo)
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        with connection.schema_editor() as editor:
            for modelo in reversed(cls.modelos):
                editor.delete_model(modelo)

    def setUp(self):
        self.provincia = Provincia.objects.create(nombre="Santa Fe")
        self.departamento = Departamento.objects.create(nombre="Rosario", provincia=self.provincia)
        self.domicilio = Domicilio.objects.create(nombre="Dirección original", departamento=self.departamento)
        self.client = APIClient()

    def test_lectura_incluye_provincia_completa_para_editar_el_domicilio(self):
        datos = DomicilioSerializer(self.domicilio).data
        self.assertEqual(datos["departamento"]["provincia"], {"id": self.provincia.pk, "nombre": "Santa Fe"})
        self.assertEqual(datos["departamento"]["id"], self.departamento.pk)

    def test_catalogo_y_detalle_tienen_el_mismo_contrato_sin_consultas_por_fila(self):
        Departamento.objects.create(nombre="Otro departamento", provincia=self.provincia)
        respuesta = self.client.get(f"/departamento/{self.departamento.pk}/")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["provincia"]["nombre"], "Santa Fe")
        with self.assertNumQueries(1):
            listado = self.client.get("/departamento/", {"id_provincia": self.provincia.pk})
        self.assertEqual(len(listado.data), 2)
        self.assertTrue(all(item["provincia"]["id"] == self.provincia.pk for item in listado.data))

    def test_alta_familiar_acepta_domicilio_por_id_departamento_y_conserva_el_original(self):
        otra_provincia = Provincia.objects.create(nombre="Córdoba")
        otro_departamento = Departamento.objects.create(nombre="Capital", provincia=otra_provincia)
        serializer = FamiliarCreateSerializer(data={"nombre": "Familiar", "apellido": "Prueba", "dni": "30000001", "sexo": "F",
            "domicilio": {"nombre": "Dirección nueva", "id_departamento": otro_departamento.pk, "domicilio_validado": None, "observaciones": "Piso 2"}})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        domicilio = crear_domicilio(dict(serializer.validated_data["domicilio"]))
        self.assertEqual(domicilio.departamento_id, otro_departamento.pk)
        self.assertIsNone(domicilio.domicilio_validado_id)
        self.assertEqual(domicilio.observaciones, "Piso 2")
        self.domicilio.refresh_from_db()
        self.assertEqual(self.domicilio.nombre, "Dirección original")
        self.assertEqual(self.domicilio.departamento_id, self.departamento.pk)

    def test_domicilio_sigue_opcional_pero_si_se_informa_requiere_departamento(self):
        base = {"nombre": "Familiar", "apellido": "Prueba", "dni": "30000001", "sexo": "F"}
        sin_domicilio = FamiliarCreateSerializer(data={**base, "domicilio": None})
        self.assertTrue(sin_domicilio.is_valid(), sin_domicilio.errors)
        incompleto = FamiliarCreateSerializer(data={**base, "domicilio": {"nombre": "Dirección"}})
        self.assertFalse(incompleto.is_valid())
        self.assertIn("id_departamento", incompleto.errors["domicilio"])

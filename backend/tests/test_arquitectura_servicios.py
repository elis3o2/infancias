"""Límites de los módulos y contratos públicos, sin base de datos ni red."""
import ast
from importlib import import_module
from importlib.util import resolve_name
from pathlib import Path
from unittest.mock import patch

from django.test import SimpleTestCase


APPS = Path(__file__).resolve().parents[1] / "src" / "apps"
CONTRATOS = {
    "persona": {
        "Persona": ["buscar_persona"],
        "Contacto": ["actualizar_domicilio", "actualizar_telefono", "procesar_datos_persona"],
        "ReglasNNyA": ["crear_adolescente", "validar_adolescente"],
        "ReglasFamiliar": ["crear_familiar", "validar_familiar"],
        "CarpetaLegajo": ["resolver_legajo", "resolver_legajos_solicitud"],
        "Consulta": ["consultar_adolescente", "consultar_familiar", "consultar_relaciones", "consultar_solicitudes", "consultar_personas"],
    },
    "solicitud": {
        "Creacion": ["crear_solicitud"],
        "Validacion": ["validar_solicitud"],
        "Estados": ["rechazar_solicitud", "derivar_solicitud"],
    },
    "domicilio": {
        "Domicilio": ["crear_domicilio"],
        "Institucion": ["crear_institucion"],
        "Geografia": ["crear_domicilio_validado", "obtener_direccion"],
    },
    "api_externa": {
        "Ciudadano": ["consultar_ciudadano"],
        "Digitalizacion": ["consultar_digitalizacion"],
        "HistoriaClinica": ["consultar_hcf"],
        "Geografia": ["transformar_coordenadas", "buscar_features_geo", "normalizar_direccion_geo",
                      "obtener_direccion_geo", "obtener_latitud_longitud_geo"],
        "Correo": ["enviar_correo"],
        "Ldap": ["consultar_ldap"],
    },
}


class ArquitecturaServiciosTests(SimpleTestCase):
    def test_cada_aplicacion_tiene_un_solo_archivo_views_y_serializers(self):
        for app in CONTRATOS:
            carpeta = APPS / app
            for nombre in ("views", "serializers"):
                with self.subTest(app=app, archivo=nombre):
                    self.assertEqual(
                        set(carpeta.rglob(f"*{nombre}*.py")),
                        {carpeta / f"{nombre}.py"},
                    )

    def test_interfaces_publicas_conservan_las_funciones_originales(self):
        for app, modulos in CONTRATOS.items():
            interfaz = import_module(f"src.apps.{app}.services")
            self.assertFalse((APPS / app / "services.py").exists())
            self.assertEqual(len(interfaz.__all__), len(set(interfaz.__all__)))
            for modulo, funciones in modulos.items():
                implementacion = import_module(f"src.apps.{app}.services.{modulo}")
                for nombre in funciones:
                    with self.subTest(app=app, funcion=nombre):
                        self.assertIn(nombre, interfaz.__all__)
                        self.assertIs(getattr(interfaz, nombre), getattr(implementacion, nombre))
            self.assertFalse(any(nombre.startswith("_") for nombre in interfaz.__all__))

    def test_todos_los_modulos_se_importan_sin_red_ni_consultas(self):
        with patch("requests.sessions.Session.request", side_effect=AssertionError("HTTP real prohibido")):
            for app in CONTRATOS:
                for archivo in (APPS / app / "services").glob("*.py"):
                    nombre = f"src.apps.{app}.services"
                    if archivo.stem != "__init__":
                        nombre += f".{archivo.stem}"
                    with self.subTest(modulo=nombre):
                        import_module(nombre)

    def test_servicios_no_dependen_de_vistas_serializers_o_su_propia_fachada(self):
        for app in CONTRATOS:
            paquete = f"src.apps.{app}.services"
            for archivo in (APPS / app / "services").glob("*.py"):
                if archivo.stem == "__init__":
                    continue
                for nodo in ast.walk(ast.parse(archivo.read_text())):
                    if not isinstance(nodo, ast.ImportFrom):
                        continue
                    origen = nodo.module or ""
                    if nodo.level:
                        origen = resolve_name("." * nodo.level + origen, paquete)
                    with self.subTest(archivo=archivo.name, origen=origen):
                        self.assertNotEqual(origen, paquete)
                        self.assertFalse(any(parte in ("views", "serializers") for parte in origen.split(".")))

    def test_transporte_y_credenciales_no_se_importan_en_servicios_de_dominio(self):
        for app in ("persona", "solicitud", "domicilio"):
            for archivo in (APPS / app / "services").glob("*.py"):
                for nodo in ast.walk(ast.parse(archivo.read_text())):
                    nombres = []
                    if isinstance(nodo, ast.Import):
                        nombres = [alias.name for alias in nodo.names]
                    elif isinstance(nodo, ast.ImportFrom) and not nodo.level:
                        nombres = [nodo.module or ""]
                    with self.subTest(archivo=archivo.name):
                        self.assertFalse(any(nombre.split(".")[0] in ("requests", "httpx", "decouple", "urllib")
                                             for nombre in nombres))

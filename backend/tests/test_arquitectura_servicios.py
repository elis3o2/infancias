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
        "Acceso": ["puede_agregar_familiares", "puede_ejecutar_accion", "puede_gestionar_admision"],
        "Admision": ["agregar_adolescente", "agregar_familiar"],
        "ArchivoReglas": ["archivos_visibles", "validar_archivos"],
        "Comentarios": ["crear_comentario", "editar_comentario", "puede_comentar_solicitud", "puede_editar_comentario"],
        "Consultas": ["obtener_solicitudes", "relaciones_solicitud", "familiares_validados_solicitud", "titulo_solicitud", "legajos_solicitud"],
        "Formulario": ["validar_relaciones_formulario"],
        "Estadisticas": ["generar_reporte"],
        "Reporte": ["obtener_reporte_solicitudes"],
    },
    "domicilio": {
        "Domicilio": ["crear_domicilio"],
        "Institucion": ["crear_institucion"],
        "Geografia": ["crear_domicilio_validado", "obtener_direccion"],
    },
    "api_externa": {
        "Ciudadano": ["consultar_ciudadano"],
        "Digitalizacion": ["consultar_digitalizacion"],
        "Renaper": ["consultar_identidad", "consultar_renaper"],
        "HistoriaClinica": ["consultar_hcf"],
        "Geografia": ["transformar_coordenadas", "buscar_features_geo", "normalizar_direccion_geo",
                      "obtener_direccion_geo", "obtener_latitud_longitud_geo"],
        "Correo": ["enviar_correo"],
        "Ldap": ["autenticar_ldap"],
    },
}


class ArquitecturaServiciosTests(SimpleTestCase):
    def test_solicitud_expone_operaciones_y_oculta_sus_decisiones_internas(self):
        servicios = import_module("src.apps.solicitud.services")
        for nombre in servicios.__all__:
            self.assertTrue(callable(getattr(servicios, nombre)), nombre)
        for nombre in ("MAX_ARCHIVOS", "MAX_TAMANO_TOTAL", "capturar_formulario", "generar_formulario_pdf"):
            self.assertNotIn(nombre, servicios.__all__)
        for nombre in ("admision", "comentarios", "reportes", "legajos", "copia_formulario", "formulario_pdf"):
            self.assertFalse((APPS / "solicitud" / f"{nombre}.py").exists())

    def test_adaptadores_solicitud_no_implementan_consultas_ni_envios(self):
        operaciones_internas = {"filter", "annotate", "aggregate", "select_related", "prefetch_related",
                               "select_for_update", "on_commit", "enviar_correo", "generar_formulario_pdf"}
        for archivo in ("views.py", "serializers.py"):
            arbol = ast.parse((APPS / "solicitud" / archivo).read_text())
            for funcion in (nodo for nodo in ast.walk(arbol) if isinstance(nodo, ast.FunctionDef)):
                for llamada in (nodo for nodo in ast.walk(funcion) if isinstance(nodo, ast.Call)):
                    nombre = llamada.func.attr if isinstance(llamada.func, ast.Attribute) else getattr(llamada.func, "id", "")
                    with self.subTest(archivo=archivo, funcion=funcion.name, llamada=nombre):
                        self.assertNotIn(nombre, operaciones_internas)

    def test_renaper_y_hcf_tienen_servicios_propios_y_clases_centralizadas(self):
        carpeta = APPS / "api_externa"
        self.assertEqual(list(carpeta.glob("identidad*.py")), [])
        self.assertFalse((carpeta / "types.py").exists())
        for nombre in ("Renaper", "HistoriaClinica"):
            with self.subTest(servicio=nombre):
                archivo = carpeta / "services" / f"{nombre}.py"
                self.assertTrue(archivo.is_file())
                self.assertFalse(any(isinstance(nodo, ast.ClassDef)
                                     for nodo in ast.walk(ast.parse(archivo.read_text()))))
        clases = import_module("src.apps.api_externa.clases")
        for nombre in ("Ciudadano", "ConfiguracionIdentidad", "EstadoLimites", "ResultadoIdentidad",
                       "ConsultaIdentidad", "DatosPersonaRNP", "DatosSisrosRNP", "HCFResponse", "HCFResultado",
                       "ConsultaPersonaExternaDatos", "IdentidadHTTPError", "IdentidadRevisionRequerida",
                       "IdentidadRespuestaParcial", "IdentidadLimiteExcedido"):
            with self.subTest(clase=nombre):
                self.assertEqual(getattr(clases, nombre).__module__, clases.__name__)

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

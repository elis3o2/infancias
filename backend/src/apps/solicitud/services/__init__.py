"""Interfaz pública de los casos de uso de solicitudes.

Cada módulo oculta sus consultas y reglas. Los adaptadores consumen operaciones;
los servicios se importan entre sí directamente para evitar dependencias circulares.
"""
from .Acceso import puede_agregar_familiares, puede_ejecutar_accion, puede_gestionar_admision
from .Admision import agregar_adolescente, agregar_familiar
from .ArchivoReglas import archivos_visibles, validar_archivos
from .Comentarios import (
    crear_comentario, editar_comentario, puede_comentar_solicitud, puede_editar_comentario,
)
from .Consultas import (
    familiares_validados_solicitud, legajos_solicitud, obtener_solicitudes,
    relaciones_solicitud, titulo_solicitud,
)
from .Creacion import crear_solicitud
from .Estadisticas import generar_reporte
from .Estados import derivar_solicitud, rechazar_solicitud
from .Formulario import validar_relaciones_formulario
from .Reporte import obtener_reporte_solicitudes
from .Validacion import validar_solicitud

__all__ = [
    "agregar_adolescente", "agregar_familiar", "archivos_visibles",
    "crear_comentario", "crear_solicitud", "derivar_solicitud", "editar_comentario",
    "familiares_validados_solicitud", "generar_reporte", "legajos_solicitud",
    "obtener_reporte_solicitudes", "obtener_solicitudes", "puede_agregar_familiares",
    "puede_comentar_solicitud", "puede_editar_comentario", "puede_ejecutar_accion", "puede_gestionar_admision",
    "rechazar_solicitud", "relaciones_solicitud", "titulo_solicitud",
    "validar_archivos", "validar_relaciones_formulario", "validar_solicitud",
]

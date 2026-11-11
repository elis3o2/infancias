"""Interfaz pública de servicios; las implementaciones se importan entre sí directamente."""

from .Persona import buscar_persona
from .Contacto import actualizar_domicilio, actualizar_telefono, procesar_datos_persona
from .ReglasFamiliar import crear_familiar, validar_familiar
from .ReglasNNyA import crear_adolescente, validar_adolescente
from .CarpetaLegajo import resolver_legajo, resolver_legajos_solicitud
from .Consulta import (
    consultar_adolescente, consultar_familiar, consultar_relaciones, consultar_solicitudes,
)
from .HistoriaClinica import consultar_personas

__all__ = [
    "buscar_persona",
    "actualizar_domicilio",
    "actualizar_telefono",
    "procesar_datos_persona",
    "crear_familiar",
    "validar_familiar",
    "crear_adolescente",
    "validar_adolescente",
    "resolver_legajo",
    "resolver_legajos_solicitud",
    "consultar_adolescente",
    "consultar_familiar",
    "consultar_relaciones",
    "consultar_solicitudes",
    "consultar_personas",
]

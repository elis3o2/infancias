"""Interfaz pública de servicios; las implementaciones se importan entre sí directamente."""

from .Domicilio import crear_domicilio
from .Institucion import crear_institucion
from .Geografia import crear_domicilio_validado, obtener_direccion

__all__ = [
    "crear_domicilio",
    "crear_institucion",
    "crear_domicilio_validado",
    "obtener_direccion",
]

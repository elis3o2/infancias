"""Interfaz pública de servicios; las implementaciones se importan entre sí directamente."""

from .Ciudadano import consultar_ciudadano
from .Digitalizacion import consultar_digitalizacion
from .HistoriaClinica import consultar_hcf
from .Geografia import (
    transformar_coordenadas, buscar_features_geo, normalizar_direccion_geo,
    obtener_direccion_geo, obtener_latitud_longitud_geo,
)
from .Correo import enviar_correo
from .Ldap import consultar_ldap
from ..identidad import consultar_identidad
from ..types import (
    ServicioExternoError, ServicioExternoNoConfigurado, RecursoExternoNoEncontrado,
)

__all__ = [
    "consultar_ciudadano",
    "consultar_digitalizacion",
    "consultar_hcf",
    "transformar_coordenadas",
    "buscar_features_geo",
    "normalizar_direccion_geo",
    "obtener_direccion_geo",
    "obtener_latitud_longitud_geo",
    "enviar_correo",
    "consultar_ldap",
    "consultar_identidad",
    "ServicioExternoError",
    "ServicioExternoNoConfigurado",
    "RecursoExternoNoEncontrado",
]

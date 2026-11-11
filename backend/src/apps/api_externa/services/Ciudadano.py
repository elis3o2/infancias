"""Contrato exacto de Ciudadano y cliente que utiliza el proxy del entorno."""
import logging
from typing import cast
import requests
from decouple import config
from ..types import Ciudadano, DatosCiudadano, JsonValue
from ..utils import TIMEOUT_EXTERNO, _como_objeto, _como_texto

logger = logging.getLogger(__name__)


def consultar_ciudadano(dni: str, sexo: str) -> Ciudadano | None:
    """Consulta Ciudadano manteniendo habilitado el proxy del entorno."""
    url = config("API_CIUDADANO", default="").strip()
    api_key = config("KEY_CIUDADANO", default="")

    if not url:
        logger.warning("La consulta de ciudadano no está configurada.")
        return None

    try:
        response = requests.get(
            url,
            params={"dni": dni, "sexo": sexo, "api_key": api_key},
            timeout=TIMEOUT_EXTERNO,
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        data = cast(JsonValue, response.json())
    except (requests.RequestException, ValueError):
        logger.warning("No fue posible consultar el servicio de ciudadano.")
        return None

    respuesta = _como_objeto(data)
    ciudadano = _como_objeto(respuesta.get("ciudadano")) if respuesta else None
    if ciudadano is None:
        logger.warning("El servicio de ciudadano devolvió una respuesta inesperada.")
        return None

    resultado = _crear_ciudadano(cast(DatosCiudadano, ciudadano))
    if resultado is None:
        logger.warning("El servicio de ciudadano no informó todos los datos requeridos.")
    return resultado


def _crear_ciudadano(ciudadano: DatosCiudadano) -> Ciudadano | None:
    """Crea la identidad sólo con los cinco campos exactos del contrato."""
    nombre = _como_texto(ciudadano.get("nombre"))
    apellido = _como_texto(ciudadano.get("apellido"))
    sexo_ciudadano = _como_texto(ciudadano.get("sexo"))
    fecha_nacimiento = _como_texto(ciudadano.get("fechaNacimiento"))
    nro_documento = ciudadano.get("nroDocumento")

    if (
        not nombre
        or not apellido
        or not sexo_ciudadano
        or not fecha_nacimiento
        or isinstance(nro_documento, bool)
        or not isinstance(nro_documento, int)
    ):
        return None

    return Ciudadano(
        nombre=nombre,
        apellido=apellido,
        nroDocumento=nro_documento,
        sexo=sexo_ciudadano,
        fechaNacimiento=fecha_nacimiento,
    )

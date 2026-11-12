from typing import cast

import requests
from decouple import config

from .types import (
    CabecerasHTTP,
    CoordenadaEntrada,
    JsonArray,
    JsonObject,
    JsonValue,
    ParametrosConsulta,
    RecursoExternoNoEncontrado,
    ServicioExternoError,
    ServicioExternoNoConfigurado,
)

TIMEOUT_EXTERNO = 10


def _url_configurada(nombre: str) -> str:
    url = config(nombre, default="").strip()
    if not url:
        raise ServicioExternoNoConfigurado(
            f"El servicio externo {nombre} no está configurado."
        )
    return url


def _obtener_json(
    url: str,
    *,
    params: ParametrosConsulta | None = None,
    headers: CabecerasHTTP | None = None,
    timeout: float | tuple[float, float] = TIMEOUT_EXTERNO,
) -> JsonValue:
    """Hace un GET directo, sin heredar proxies del entorno de ejecución."""
    try:
        with requests.Session() as session:
            session.trust_env = False
            response = session.get(
                url,
                params=params,
                headers=headers,
                timeout=timeout,
            )
    except requests.RequestException as exc:
        raise ServicioExternoError("No fue posible conectar con el servicio externo.") from exc

    if response.status_code == 404:
        raise RecursoExternoNoEncontrado()

    try:
        response.raise_for_status()
    except requests.RequestException as exc:
        raise ServicioExternoError(
            f"El servicio externo respondió con HTTP {response.status_code}."
        ) from exc

    try:
        return cast(JsonValue, response.json())
    except ValueError as exc:
        raise ServicioExternoError(
            "El servicio externo devolvió una respuesta inválida."
        ) from exc


def _como_objeto(valor: JsonValue | None) -> JsonObject | None:
    return valor if isinstance(valor, dict) else None


def _como_lista(valor: JsonValue | None) -> JsonArray | None:
    return valor if isinstance(valor, list) else None


def _como_texto(valor: JsonValue | None) -> str | None:
    return valor if isinstance(valor, str) else None


def _como_coordenada(valor: JsonValue) -> CoordenadaEntrada | None:
    if isinstance(valor, bool):
        return None
    if isinstance(valor, (str, int, float)):
        return valor
    return None



def _numero(valor: JsonValue | None) -> int | None:
    try:
        return int(valor)
    except (TypeError, ValueError):
        return None

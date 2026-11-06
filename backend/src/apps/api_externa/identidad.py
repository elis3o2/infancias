"""Consulta independiente. No crea personas ni reemplaza las APIs existentes."""

import math
import time
from collections.abc import Sequence
from datetime import timezone
from email.utils import parsedate_to_datetime
from typing import cast

import requests

from .identidad_config import cargar_configuracion
from .identidad_limites import limitar_consulta
from .identidad_types import (
    ConsultaIdentidad, IdentidadHTTPError, IdentidadLimiteExcedido,
    IdentidadRevisionRequerida, ResultadoIdentidad, SeccionIdentidad, SexoIdentidad,
)
from .types import JsonObject, ServicioExternoError
from .utils import TIMEOUT_EXTERNO


def _consulta(dni: str, sexo: SexoIdentidad, secciones: Sequence[SeccionIdentidad] | None) -> ConsultaIdentidad:
    if not isinstance(dni, str) or not dni.strip() or not dni.strip().isascii() or not dni.strip().isdigit():
        raise ValueError("El DNI debe ser un texto con dígitos.")
    if sexo not in ("F", "M", "X"):
        raise ValueError("El sexo debe ser F, M o X.")
    datos: ConsultaIdentidad = {"dni": dni.strip(), "sexo": sexo}
    if secciones is not None:
        if isinstance(secciones, str) or not secciones or any(s not in ("renaper", "puco", "sisros") for s in secciones):
            raise ValueError("Las secciones permitidas son renaper, puco y sisros.")
        datos["secciones"] = list(dict.fromkeys(secciones))
    if sexo == "X":
        if secciones is None:
            # Omitir secciones pediría también PUCO, que no admite X.
            raise ValueError("Para sexo X indicá las secciones explícitamente, sin puco.")
        if "puco" in secciones:
            raise ValueError("PUCO no admite sexo X.")
    return datos


def _retry_after(valor: str | None) -> int:
    if valor:
        valor = valor.strip()
        if valor.isascii() and valor.isdigit():
            return max(3, int(valor))
        try:
            fecha = parsedate_to_datetime(valor)
            if fecha.tzinfo is None:
                fecha = fecha.replace(tzinfo=timezone.utc)
            return max(3, math.ceil(fecha.timestamp() - time.time()))
        except (TypeError, ValueError, OverflowError):
            pass
    return 60  # Espera conservadora si el proveedor no informa un valor válido.


def consultar_identidad(
    dni: str,
    sexo: SexoIdentidad,
    secciones: Sequence[SeccionIdentidad] | None = None,
) -> ResultadoIdentidad:
    """Devuelve el JSON sin normalizar; 207 no significa validación completa.

    No reintenta ni cambia de método automáticamente. Los consumidores deben
    revisar cada bloque, y tratar 409 como revisión humana obligatoria.
    """
    datos = _consulta(dni, sexo, secciones)
    configuracion = cargar_configuracion()
    with limitar_consulta(configuracion.archivo_limites) as limite:
        try:
            with requests.Session() as session:
                session.trust_env = configuracion.usar_proxy
                respuesta = session.request(
                    configuracion.metodo,
                    configuracion.url,
                    json=datos,
                    headers={"X-API-Key": configuracion.clave, "Accept": "application/json"},
                    verify=str(configuracion.certificado),
                    timeout=TIMEOUT_EXTERNO,
                    allow_redirects=False,
                )
        except requests.exceptions.SSLError as exc:
            raise ServicioExternoError("No se pudo verificar el certificado TLS de Identidad.") from exc
        except requests.RequestException as exc:
            raise ServicioExternoError("No fue posible conectar con Identidad.") from exc

        codigo = respuesta.status_code
        if codigo == 409:
            raise IdentidadRevisionRequerida()
        if codigo == 429:
            segundos = _retry_after(respuesta.headers.get("Retry-After"))
            limite.pausar(segundos)
            raise IdentidadLimiteExcedido(segundos, remoto=True)
        if codigo in (401, 403):
            raise IdentidadHTTPError(codigo, "La clave de Identidad es inválida o no autoriza las secciones solicitadas.")
        if codigo in (502, 503, 504):
            raise IdentidadHTTPError(codigo, "Una fuente de Identidad no está disponible.")
        if codigo not in (200, 207):
            raise IdentidadHTTPError(codigo, f"Identidad respondió con HTTP {codigo}.")
        try:
            cuerpo: object = respuesta.json()
        except ValueError as exc:
            raise ServicioExternoError("Identidad devolvió un JSON inválido.") from exc
        if not isinstance(cuerpo, dict):
            raise ServicioExternoError("Identidad no devolvió un objeto JSON.")
        return ResultadoIdentidad(codigo_http=codigo, datos=cast(JsonObject, cuerpo))


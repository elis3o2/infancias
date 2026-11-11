"""Contrato de Digitalización y política de respaldo mediante Identidad/RNP."""
import logging
import time
from typing import cast
from decouple import config
from ..identidad import consultar_identidad
from ..identidad_normalizacion import normalizar_identidad
from ..identidad_types import IdentidadLimiteExcedido, ResultadoIdentidad, SeccionIdentidad, SexoIdentidad
from ..types import DatosCiudadano, DatosDigitalizacion, RespuestaDigitalizacion, ServicioExternoError, RecursoExternoNoEncontrado
from ..utils import _como_objeto, _como_texto, _obtener_json, _url_configurada
from .Ciudadano import _crear_ciudadano

logger = logging.getLogger(__name__)


def _consultar_api_digitalizacion(dni: str, sexo: str) -> RespuestaDigitalizacion:
    data = _obtener_json(
        _url_configurada("API_DIGITALIZACION"),
        params={
            "api_key": config("KEY_DIGITALIZACION", default=""),
            "documento": dni,
            "sexo": sexo,
        },
    )
    if _como_objeto(data) is None:
        raise ServicioExternoError(
            "El servicio de digitalización devolvió una respuesta inesperada."
        )
    return cast(RespuestaDigitalizacion, data)


def consultar_digitalizacion(dni: str, sexo: str) -> DatosDigitalizacion | None:
    """Digitalización primero; Identidad como respaldo ante fallas, no ante 404."""
    if not sexo:
        return None

    try:
        data = _consultar_api_digitalizacion(dni=dni, sexo=sexo)
    except RecursoExternoNoEncontrado:
        logger.info("No se encontraron datos de digitalización para la consulta.")
        return None
    except ServicioExternoError as exc:
        logger.warning("Digitalización falló; se consultará Identidad: %s", exc)
    else:
        datos = _normalizar_digitalizacion(data)
        if datos is not None:
            return datos
        logger.warning("Digitalización devolvió datos incompletos; se consultará Identidad.")

    respaldo = _consultar_identidad_respaldo(dni, sexo)
    return normalizar_identidad(respaldo, dni, sexo)


def _consultar_identidad_respaldo(dni: str, sexo: str) -> ResultadoIdentidad:
    try:
        secciones: list[SeccionIdentidad] = ["renaper", "sisros"] if sexo == "X" else ["renaper", "puco", "sisros"]
        try:
            return consultar_identidad(dni, cast(SexoIdentidad, sexo), secciones=secciones)
        except IdentidadLimiteExcedido as exc:
            if exc.remoto or exc.reintentar_en > 3:
                raise
            # Consultas consecutivas del mismo formulario: esperar el intervalo
            # local una sola vez. No reintentar una petición HTTP ya enviada.
            time.sleep(exc.reintentar_en)
            return consultar_identidad(dni, cast(SexoIdentidad, sexo), secciones=secciones)
    except ValueError as exc:
        raise ServicioExternoError("Los datos de consulta no son válidos para Identidad.") from exc


def _normalizar_digitalizacion(data: RespuestaDigitalizacion) -> DatosDigitalizacion | None:
    """Contrato de Digitalización: identidad en sisa_data, HC en results_query1[0]."""
    sisa_data = data.get("sisa_data")
    datos_ciudadano = sisa_data.get("ciudadano") if isinstance(sisa_data, dict) else None
    resultados = data.get("results_query1")
    if not isinstance(datos_ciudadano, dict):
        return None

    ciudadano = _crear_ciudadano(cast(DatosCiudadano, datos_ciudadano))
    hc = None
    if isinstance(resultados, list) and resultados and isinstance(resultados[0], dict):
        hc = _como_texto(resultados[0].get("hc"))
    if ciudadano is None:
        return None
    return {**ciudadano.como_dict(), "hc": hc}

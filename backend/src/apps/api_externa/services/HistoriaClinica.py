"""Cliente HCF: respuesta del proveedor a partir de una HC individual."""
import logging
from typing import cast
from decouple import config
from ..types import HCFResponse, RecursoExternoNoEncontrado, ServicioExternoError, ServicioExternoNoConfigurado
from ..utils import _como_objeto, _obtener_json, _url_configurada

logger = logging.getLogger(__name__)


def consultar_hcf(hcf: int | str) -> HCFResponse | None:
    """Consulta la HCF y sus integrantes a partir de una HC individual."""
    try:
        data = _obtener_json(
            _url_configurada("API_HCF"),
            params={"hcf": hcf},
            headers={"HCF_PPVV_API_KEY": config("HCF_PPVV_API_KEY", default="")},
        )
        respuesta = _como_objeto(data)
        if (
            respuesta is None
            or not isinstance(respuesta.get("hcf"), str)
            or not isinstance(respuesta.get("resultados"), list)
        ):
            raise ServicioExternoError("API_HCF devolvió una respuesta inesperada.")
        return cast(HCFResponse, respuesta)
    except RecursoExternoNoEncontrado:
        return None
    except ServicioExternoNoConfigurado:
        logger.warning("La consulta HCF no está configurada.")
        return None
    except ServicioExternoError as exc:
        logger.warning("No fue posible consultar la historia clínica familiar: %s", exc)
        return None

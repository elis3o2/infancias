"""Cliente HCF: respuesta del proveedor a partir de una HC individual."""
import logging
from typing import cast
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from decouple import config
from ..types import HCFResponse, RecursoExternoNoEncontrado, ServicioExternoError, ServicioExternoNoConfigurado
from ..utils import TIMEOUT_EXTERNO, _como_objeto, _obtener_json, _url_configurada

logger = logging.getLogger(__name__)
TIMEOUT_HCF = 60


def _url_hcf() -> str:
    url = urlsplit(_url_configurada("API_HCF"))
    # La configuración puede incluir ?hci=; el número se envía una sola vez en params.
    parametros = [(nombre, valor) for nombre, valor in parse_qsl(url.query, keep_blank_values=True)
                  if nombre != "hci"]
    return urlunsplit(url._replace(query=urlencode(parametros)))


def consultar_hcf(hci: int | str) -> HCFResponse | None:
    """Consulta la HCF y sus integrantes a partir de una HC individual."""
    try:
        data = _obtener_json(
            _url_hcf(),
            params={"hci": hci},
            headers={"HCF_PPVV_API_KEY": config("HCF_PPVV_API_KEY", default="")},
            timeout=(TIMEOUT_EXTERNO, TIMEOUT_HCF),
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

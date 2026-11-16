"""Cliente HCF: respuesta del proveedor a partir de una historia familiar."""
from typing import cast
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from decouple import config
from ..clases import HCFResponse, RecursoExternoNoEncontrado, ServicioExternoError
from ..utils import TIMEOUT_EXTERNO, _como_objeto, _obtener_json, _url_configurada

TIMEOUT_HCF = 60


def _url_hcf() -> str:
    url = urlsplit(_url_configurada("API_HCF"))
    # Eliminar el parámetro actual y el anterior; el número se envía una sola vez.
    parametros = [(nombre, valor) for nombre, valor in parse_qsl(url.query, keep_blank_values=True)
                  if nombre not in {"hci", "hcf"}]
    return urlunsplit(url._replace(query=urlencode(parametros)))


def consultar_hcf(hcf: int | str) -> HCFResponse | None:
    """Consulta la HCF y sus integrantes a partir de su número familiar."""
    try:
        data = _obtener_json(
            _url_hcf(),
            params={"hcf": hcf},
            headers={"HCF_PPVV_API_KEY": config("HCF_PPVV_API_KEY", default="")},
            timeout=(TIMEOUT_EXTERNO, TIMEOUT_HCF),
        )
        respuesta = _como_objeto(data)
        if (
            respuesta is None
            or not isinstance(respuesta.get("hcf"), int)
            or isinstance(respuesta.get("hcf"), bool)
            or not isinstance(respuesta.get("resultados"), list)
        ):
            raise ServicioExternoError("API_HCF devolvió una respuesta inesperada.")
        return cast(HCFResponse, respuesta)
    except RecursoExternoNoEncontrado:
        return None

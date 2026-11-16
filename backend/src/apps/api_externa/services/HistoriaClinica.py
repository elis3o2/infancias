"""Cliente HCF: respuesta del proveedor a partir de una historia familiar."""
from typing import cast
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from decouple import config
from ..clases import HCFResponse, JsonValue, RecursoExternoNoEncontrado, ServicioExternoError
from ..utils import TIMEOUT_EXTERNO, _como_objeto, _obtener_json, _url_configurada

TIMEOUT_HCF = 60


def _numero_hcf(valor: JsonValue) -> int:
    """El proveedor puede enviar el número familiar como texto decimal."""
    if isinstance(valor, str) and valor.isascii() and valor.isdecimal():
        try:
            valor = int(valor)
        except ValueError:
            raise ServicioExternoError("API_HCF devolvió una respuesta inesperada.") from None
    if isinstance(valor, bool) or not isinstance(valor, int) or valor <= 0:
        raise ServicioExternoError("API_HCF devolvió una respuesta inesperada.")
    return valor


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
        if respuesta is None or not isinstance(respuesta.get("resultados"), list):
            raise ServicioExternoError("API_HCF devolvió una respuesta inesperada.")
        return cast(HCFResponse, {**respuesta, "hcf": _numero_hcf(respuesta.get("hcf"))})
    except RecursoExternoNoEncontrado:
        return None

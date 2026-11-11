"""Transporte de correo y adjuntos; desconoce solicitudes y formularios."""
from typing import cast
import requests
from decouple import config
from ..types import ArchivosAdjuntos, DestinatariosCorreo, JsonValue, RespuestaCorreo, ServicioExternoError
from ..utils import _como_objeto, _url_configurada


def enviar_correo(
    subject: str,
    body: str,
    to_emails: DestinatariosCorreo,
    attachments: ArchivosAdjuntos | None = None,
) -> RespuestaCorreo:
    """Envía correo mediante API_EMAIL sin registrar datos sensibles."""
    data: list[tuple[str, str]] = [
        ("from_email", config("FROM_EMAIL", default="")),
        ("subject", subject),
        ("body", body),
    ]
    data.extend(("to_emails", email) for email in to_emails)

    files: list[tuple[str, tuple[str, bytes, str]]] = []
    for archivo in attachments or []:
        files.append(
            (
                "attachment",
                (
                    archivo.name,
                    archivo.read(),
                    getattr(archivo, "content_type", "application/octet-stream"),
                ),
            )
        )

    try:
        with requests.Session() as session:
            session.trust_env = False
            response = session.post(
                _url_configurada("API_EMAIL"),
                data=data,
                files=files,
                timeout=30,
            )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise ServicioExternoError("No fue posible enviar el correo.") from exc

    try:
        result = cast(JsonValue, response.json())
    except ValueError as exc:
        raise ServicioExternoError("API_EMAIL devolvió una respuesta no válida.") from exc
    respuesta = _como_objeto(result)
    if respuesta is None:
        raise ServicioExternoError("API_EMAIL devolvió una respuesta inesperada.")
    if respuesta.get("error"):
        raise ServicioExternoError("API_EMAIL informó un error al enviar el correo.")
    return respuesta

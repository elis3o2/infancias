"""Contenido de avisos y copia adjunta, sin revertir operaciones ya confirmadas."""
import logging
from django.core.files.uploadedfile import SimpleUploadedFile
from src.apps.api_externa.services import enviar_correo
from src.apps.api_externa.types import ArchivosAdjuntos
from ..copia_formulario import CopiaFormulario
from ..formulario_pdf import generar_formulario_pdf

logger = logging.getLogger(__name__)


def _notificar_por_correo(*, subject: str, body: str, correo: str, attachments: ArchivosAdjuntos | None = None) -> None:
    """Envía avisos sin revertir una solicitud si el proveedor está caído."""
    try:
        enviar_correo(subject=subject, body=body, to_emails=[correo], attachments=attachments)
    except Exception:
        logger.exception("No se pudo enviar la notificación de la solicitud.")


def _confirmar_solicitud_por_correo(datos: CopiaFormulario, correo: str) -> None:
    try:
        adjunto = SimpleUploadedFile(f"solicitud-{datos.numero}.pdf", generar_formulario_pdf(datos), content_type="application/pdf")
    except Exception as exc:
        logger.error("No se pudo generar la copia del formulario de la solicitud %s (%s).", datos.numero, type(exc).__name__)
        return
    _notificar_por_correo(subject="FORMULARIO PROBLEMÁTICA",
        body=f"La solicitud #{datos.numero} fue enviada correctamente. Se adjunta una copia del formulario enviado.",
        correo=correo, attachments=[adjunto])

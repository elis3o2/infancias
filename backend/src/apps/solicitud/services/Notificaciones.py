"""Avisos de solicitud: contenido, copia adjunta y envío después del commit."""
import logging

from django.db import transaction

from src.apps.api_externa.services import enviar_correo
from src.apps.api_externa.clases import ArchivosAdjuntos
from ..clases import CopiaFormulario
from ..models import Solicitud
from .CopiaSolicitud import capturar_formulario, crear_adjunto_formulario

logger = logging.getLogger(__name__)


def _notificar_por_correo(*, subject: str, body: str, correo: str, attachments: ArchivosAdjuntos | None = None) -> None:
    """Un fallo del proveedor no revierte una operación ya confirmada."""
    try:
        enviar_correo(subject=subject, body=body, to_emails=[correo], attachments=attachments)
    except Exception:
        logger.exception("No se pudo enviar la notificación de la solicitud.")


def _confirmar_solicitud_por_correo(datos: CopiaFormulario, correo: str) -> None:
    try:
        adjunto = crear_adjunto_formulario(datos)
    except Exception as exc:
        logger.error("No se pudo generar la copia del formulario de la solicitud %s (%s).", datos.numero, type(exc).__name__)
        return
    _notificar_por_correo(
        subject="FORMULARIO PROBLEMÁTICA",
        body="La solicitud fue enviada correctamente. Se adjunta una copia del formulario enviado.",
        correo=correo, attachments=[adjunto],
    )


def programar_confirmacion(solicitud: Solicitud) -> None:
    if solicitud.correo:
        # Capturar antes del commit; no incorporar cambios posteriores al formulario.
        copia = capturar_formulario(solicitud)
        correo = solicitud.correo
        transaction.on_commit(lambda: _confirmar_solicitud_por_correo(copia, correo))


def _programar_aviso(solicitud: Solicitud, mensaje: str) -> None:
    correo = solicitud.correo
    if correo:
        transaction.on_commit(lambda: _notificar_por_correo(
            subject="FORMULARIO PROBLEMÁTICA", body=mensaje, correo=correo,
        ))


def notificar_validacion(solicitud: Solicitud) -> None:
    _programar_aviso(solicitud, "Su solicitud fue derivada al equipo de admisión.")


def notificar_rechazo(solicitud: Solicitud, motivo: str) -> None:
    _programar_aviso(
        solicitud,
        "Su solicitud fue rechazada. A continuación se detallan los motivos.\n\n" + motivo,
    )


def notificar_derivacion(solicitud: Solicitud, equipo_nombre: str) -> None:
    _programar_aviso(solicitud, "Su solicitud fue derivada al siguiente equipo: " + equipo_nombre)

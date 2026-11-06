from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from .models import Solicitud, SolicitudComentario
from .constantes import ID_ENTRADA
from .permissions import puede_registrar_situaciones


def puede_comentar_solicitud(solicitud, usuario) -> bool:
    if not puede_registrar_situaciones(usuario) or solicitud.rechazado:
        return False
    if solicitud.equipo_id == usuario.equipo_id:
        return bool(solicitud.validado or usuario.equipo_id == ID_ENTRADA)
    return bool(solicitud.validado)


def puede_editar_comentario(comentario, usuario) -> bool:
    return bool(
        puede_comentar_solicitud(comentario.solicitud, usuario)
        and comentario.usuario_id == usuario.pk
    )


def _solicitud_para_comentar(solicitud: Solicitud, usuario) -> Solicitud:
    solicitud = Solicitud.objects.select_for_update().get(pk=solicitud.pk)
    if not puede_comentar_solicitud(solicitud, usuario):
        raise PermissionDenied("Solo Entrada y Admisión pueden registrar situaciones de solicitudes habilitadas y no rechazadas.")
    return solicitud


@transaction.atomic
def crear_comentario(solicitud: Solicitud, usuario, texto: str) -> SolicitudComentario:
    solicitud = _solicitud_para_comentar(solicitud, usuario)
    fecha = timezone.now()
    return SolicitudComentario.objects.create(
        solicitud=solicitud, usuario=usuario, comentario=texto,
        fecha_hora_creacion=fecha, fecha_hora_ultmod=fecha,
    )


@transaction.atomic
def editar_comentario(
    solicitud: Solicitud, comentario_id: int, usuario, texto: str,
) -> SolicitudComentario:
    solicitud = _solicitud_para_comentar(solicitud, usuario)
    comentario = get_object_or_404(
        SolicitudComentario.objects.select_for_update().select_related("usuario", "solicitud"),
        pk=comentario_id, solicitud=solicitud,
    )
    if not puede_editar_comentario(comentario, usuario):
        raise PermissionDenied("Solo el usuario que creó el comentario puede editarlo.")
    if comentario.comentario != texto:
        comentario.comentario = texto
        comentario.fecha_hora_ultmod = timezone.now()
        comentario.save(update_fields=["comentario", "fecha_hora_ultmod"])
    return comentario

"""Transiciones de rechazo y derivación, con notificación posterior al commit."""
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from src.models import Equipo
from ..models import Solicitud
from .Notificaciones import _notificar_por_correo


@transaction.atomic
def rechazar_solicitud(solicitud, motivo: str):
    if solicitud.validado or solicitud.rechazado:
        raise ValidationError({
            "error": "Una solicitud ya procesada (validada o rechazada) no puede rechazarse."
        })

    solicitud.validado = False
    solicitud.rechazado = True
    solicitud.motivo_rechazo = motivo
    solicitud.fecha_hora_entrada = timezone.now()

    solicitud.save(
        update_fields=[
            "validado",
            "rechazado",
            "motivo_rechazo",
            "fecha_hora_entrada",
        ]
    )

    if solicitud.correo:
        transaction.on_commit(
            lambda: _notificar_por_correo(
                subject="FORMULARIO PROBLEMÁTICA",
                body=(
                    "Su solicitud fue rechazada. "
                    "A continuación se detallan los motivos.\n\n"
                    f"{motivo}"
                ),
                correo=solicitud.correo,
            )
        )

    return solicitud


@transaction.atomic
def derivar_solicitud(solicitud: Solicitud, equipo_id: str) -> Solicitud:
    solicitud = Solicitud.objects.select_for_update().get(pk=solicitud.pk)
    if not solicitud.validado:
        raise ValidationError({
            "error": "Una solicitud debe estar validadada para ser derivada."
        })
    
    try:
        equipo = Equipo.objects.get(pk=equipo_id)
    except Equipo.DoesNotExist:
        raise ValidationError({"equipo_id": "El equipo especificado no existe."})

    solicitud.equipo = equipo 
    solicitud.fecha_hora_admision = timezone.now()

    solicitud.save(update_fields=["equipo", "fecha_hora_admision"])

    if solicitud.correo:
        transaction.on_commit(
            lambda: _notificar_por_correo(
                subject="FORMULARIO PROBLEMÁTICA",
                body=(
                    "Su solicitud fue derivada al siguiente equipo: "
                    f"{equipo.nombre}"
                ),
                correo=solicitud.correo,
            )
        )

    return solicitud

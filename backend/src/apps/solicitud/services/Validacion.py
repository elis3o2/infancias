"""Validación completa y atómica; la carpeta común se resuelve al finalizar."""
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from src.apps.persona.models import Familiar
from src.apps.persona.services import validar_adolescente, validar_familiar, resolver_legajos_solicitud
from ..models import Solicitud
from ..constantes import ID_ADMISION
from .Notificaciones import _notificar_por_correo


@transaction.atomic
def validar_solicitud(solicitud: Solicitud, data: dict) -> Solicitud:
    solicitud = Solicitud.objects.select_for_update().get(pk=solicitud.pk)
    if solicitud.validado or solicitud.rechazado:
        raise ValidationError({"error": "La solicitud ya fue procesada."})

    adolescentes_data = data.get("adolescentes", [])
    if not adolescentes_data:
        raise ValidationError({"adolescentes": "Debe validar al menos un adolescente."})

    adolescentes_solicitud = {
        adolescente.id: adolescente
        for adolescente in solicitud.adolescentes.select_related("persona__legajo__carpeta")
    }
    ids = [datos["id"] for datos in adolescentes_data]
    if len(ids) != len(set(ids)):
        raise ValidationError({"adolescentes": "No puede validar dos veces al mismo adolescente."})
    if set(ids) - set(adolescentes_solicitud):
        raise ValidationError({"adolescentes": "Hay adolescentes que no pertenecen a la solicitud."})
    if set(adolescentes_solicitud) - set(ids):
        raise ValidationError({"adolescentes": "Debe validar todos los adolescentes de la solicitud."})
    if solicitud.familiares.filter(adolescente__isnull=True).exists():
        raise ValidationError({
            "familiares": "Hay familiares históricos sin adolescente. Debe asociarlos antes de validar."
        })

    personas_legajos = []
    for adolescente_data in adolescentes_data:
        adolescente = adolescentes_solicitud[adolescente_data["id"]]
        persona = validar_adolescente(adolescente, adolescente_data["persona"])
        familiares = {familiar.id: familiar for familiar in adolescente.familiares.all()}
        recibidos = set()
        identidades = set()

        for familiar_data in adolescente_data.get("familiares", []):
            datos_persona = familiar_data["persona"]
            identidad = (datos_persona["dni"], datos_persona["sexo"])
            if identidad in identidades:
                raise ValidationError({"familiares": "Un familiar está repetido para el mismo adolescente."})
            identidades.add(identidad)

            familiar_id = familiar_data.get("id")
            if familiar_id is not None:
                familiar = familiares.get(familiar_id)
                if familiar is None:
                    raise ValidationError({"familiares": "El familiar no pertenece a este adolescente."})
            else:
                coincidencias = [
                    familiar for familiar in familiares.values()
                    if (familiar.dni, familiar.sexo) == identidad
                ]
                if len(coincidencias) > 1:
                    raise ValidationError({"familiares": "Indique el id del familiar para evitar ambigüedad."})
                familiar = coincidencias[0] if coincidencias else Familiar(
                    solicitud=solicitud, adolescente=adolescente,
                )

            if familiar.pk is not None:
                if familiar.pk in recibidos:
                    raise ValidationError({"familiares": "No puede validar dos veces al mismo familiar."})
                recibidos.add(familiar.pk)

            validar_familiar(familiar, familiar_data, persona)

        if set(familiares) - recibidos:
            raise ValidationError({"familiares": "Debe validar todos los familiares del adolescente."})

        personas_legajos.append((persona, adolescente_data.get("legajo")))

    resolver_legajos_solicitud(personas_legajos)

    if "descripcion_extra" in data:
        solicitud.descripcion_extra = data["descripcion_extra"]
    solicitud.validado = True
    solicitud.equipo_id = ID_ADMISION
    solicitud.fecha_hora_entrada = timezone.now()
    solicitud.save(update_fields=[
        "descripcion_extra", "validado", "equipo", "fecha_hora_entrada",
    ])

    if solicitud.correo:
        transaction.on_commit(
            lambda: _notificar_por_correo(
                subject="FORMULARIO PROBLEMÁTICA",
                body="Su solicitud fue derivada al equipo de admisión.",
                correo=solicitud.correo,
            )
        )
    return solicitud

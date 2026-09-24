import logging
from pathlib import Path

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import Solicitud, Archivo
from src.apps.persona.models import Familiar, RelacionAdolescente
from src.models import Equipo
from src.apps.persona.services import (
    crear_adolescente, validar_adolescente, validar_familiar, resolver_legajos_solicitud,
)
from src.apps.domicilio.models import Institucion
from src.apps.domicilio.services import crear_institucion
from src.utils import enviar_correo
from django.core.files.uploadedfile import UploadedFile
from .constantes import ID_ENTRADA, ID_ADMISION

logger = logging.getLogger(__name__)


def _notificar_por_correo(*, subject: str, body: str, correo: str) -> None:
    """Envía avisos sin revertir una solicitud si el proveedor está caído."""
    try:
        enviar_correo(subject=subject, body=body, to_emails=[correo])
    except Exception:
        logger.exception("No se pudo enviar la notificación de la solicitud.")

@transaction.atomic
def crear_solicitud(datos_solicitud: dict, archivos: list[UploadedFile] | None = None) -> Solicitud:

    datos_solicitud = datos_solicitud.copy()

    adolescentes_data = datos_solicitud.pop("adolescentes", [])
    relaciones_data = datos_solicitud.pop("relaciones_adolescentes", [])
    institucion_solicitante = datos_solicitud.get("institucion")
    if isinstance(institucion_solicitante, dict):
        datos_solicitud["institucion"] = crear_institucion(
            institucion_solicitante.copy()
        )
    elif institucion_solicitante is not None and not isinstance(
        institucion_solicitante, Institucion
    ):
        raise ValidationError({"institucion": "La institución solicitante es inválida."})

    datos_solicitud["fecha_hora_creacion"] = timezone.now()
    datos_solicitud["validado"] = False
    datos_solicitud["rechazado"] = False

    solicitud = Solicitud.objects.create(
        equipo_id=ID_ENTRADA,
        **datos_solicitud,
    )

    adolescentes = {}
    referencias_por_temp = {}
    for adolescente_data in adolescentes_data:
        id_temp = adolescente_data["id_temp"]
        if id_temp in adolescentes:
            raise ValidationError({"adolescentes": "Los id_temp no pueden repetirse."})
        adolescentes[id_temp] = crear_adolescente(
            adolescente_data,
            solicitud,
            referencias_por_temp=referencias_por_temp,
        )

    for relacion_data in relaciones_data:
        adolescente1 = adolescentes.get(relacion_data["id_temp1"])
        adolescente2 = adolescentes.get(relacion_data["id_temp2"])
        if adolescente1 is None or adolescente2 is None or adolescente1 == adolescente2:
            raise ValidationError({"relaciones_adolescentes": "Los adolescentes de la relación son inválidos."})
        if not relacion_data["vinculo"].adolescente:
            raise ValidationError({
                "relaciones_adolescentes": "El vínculo debe ser de tipo adolescente."
            })
        RelacionAdolescente.objects.get_or_create(
            adolescente1=adolescente1,
            adolescente2=adolescente2,
            vinculo=relacion_data["vinculo"],
        )

    if archivos:
        for file in archivos:
            Archivo.objects.create(
                solicitud=solicitud,
                nombre=Path(file.name).name,
                tipo_mime=file.content_type,
                contenido=file.read(),
            )

    if solicitud.correo:
        transaction.on_commit(
            lambda: _notificar_por_correo(
                subject="FORMULARIO PROBLEMÁTICA",
                body="La solicitud fue enviada correctamente.",
                correo=solicitud.correo,
            )
        )

    return solicitud


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

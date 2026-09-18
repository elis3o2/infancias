import logging
from pathlib import Path

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import Solicitud, Archivo, SolicitudInstitucion
from src.apps.domicilio.models import Institucion
from src.apps.domicilio.services import crear_institucion 
from src.models import Equipo
from src.apps.persona.services import (crear_adolescente, crear_familiar, validar_adolescente, validar_familiar)
from src.utils import enviar_correo
from django.core.files.uploadedfile import UploadedFile

ID_ENTRADA  = 1
ID_ADMISION = 2

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
    institucion_data = datos_solicitud.pop("institucion", None)
    familiares_data = datos_solicitud.pop("familiares", [])
    referencias_data = datos_solicitud.pop("referencias_instituciones_data", [])

    institucion_obj = None

    if isinstance(institucion_data, dict):
        institucion_obj = crear_institucion(institucion_data)

    elif isinstance(institucion_data, Institucion):
        institucion_obj = institucion_data

    datos_solicitud["institucion"] = institucion_obj
    datos_solicitud["fecha_hora_creacion"] = timezone.now()
    datos_solicitud["validado"] = False
    datos_solicitud["rechazado"] = False

    solicitud = Solicitud.objects.create(
        equipo_id=ID_ENTRADA,
        **datos_solicitud
    )

    for adolescente_data in adolescentes_data:
        crear_adolescente(adolescente_data, solicitud)

    for familiar_data in familiares_data:
        crear_familiar(familiar_data, solicitud)

    for referencia_data in referencias_data:
        referencia_data = referencia_data.copy()

        institucion_referida = referencia_data.pop("id", None)

        if isinstance(institucion_referida, Institucion):
            institucion = institucion_referida
        elif institucion_referida is not None:
            try:
                institucion = Institucion.objects.get(pk=institucion_referida)
            except Institucion.DoesNotExist as exc:
                raise ValidationError(
                    {"referencias_instituciones_data": "La institución indicada no existe."}
                ) from exc
        else:
            institucion = crear_institucion(referencia_data)

        SolicitudInstitucion.objects.create(
            solicitud=solicitud,
            institucion=institucion,
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
    if solicitud.validado or solicitud.rechazado:
        raise ValidationError({"error": "La solicitud ya fue procesada."})

    data = data.copy()

    adolescentes_data = data.pop("adolescentes", [])
    if not adolescentes_data:
        raise ValidationError(
            {"adolescentes": "Debe validar al menos un adolescente."}
        )

    adolescentes_solicitud = {
        adolescente.id: adolescente
        for adolescente in solicitud.adolescentes.select_related("persona__legajo__carpeta")
    }
    ids_recibidos: set[int] = set()
    personas_adolescentes = []
    familiares_data = []
    familiares_rechazados_ids: list[int] = []
    se_informaron_decisiones_familiares = False
    adolescentes_confirmados = 0

    for adolescente_data in adolescentes_data:
        adolescente_id = adolescente_data.get("id")
        if adolescente_id in ids_recibidos:
            raise ValidationError(
                {"adolescentes": f"El adolescente {adolescente_id} fue enviado más de una vez."}
            )

        adolescente = adolescentes_solicitud.get(adolescente_id)
        if adolescente is None:
            raise ValidationError(
                {"adolescentes": f"El adolescente {adolescente_id} no pertenece a la solicitud."}
            )

        ids_recibidos.add(adolescente_id)

        # Los rechazados forman parte de la decisión completa de la solicitud,
        # pero no generan ni actualizan una Persona.
        if adolescente_data.get("estado", "confirmado") == "rechazado":
            continue

        adolescentes_confirmados += 1
        persona_adolescente = validar_adolescente(
            adolescente=adolescente,
            data=adolescente_data["adolescente_validado"],
        )
        if all(persona.id != persona_adolescente.id for persona in personas_adolescentes):
            personas_adolescentes.append(persona_adolescente)

        familiares_data.extend(adolescente_data.get("familiares_validados", []))
        if "familiares_rechazados" in adolescente_data:
            se_informaron_decisiones_familiares = True
            familiares_rechazados_ids.extend(
                adolescente_data["familiares_rechazados"]
            )

    faltantes = set(adolescentes_solicitud) - ids_recibidos
    if faltantes:
        raise ValidationError(
            {
                "adolescentes": (
                    "Faltan datos de validación para los adolescentes: "
                    + ", ".join(str(adolescente_id) for adolescente_id in sorted(faltantes))
                )
            }
        )

    if adolescentes_confirmados == 0:
        raise ValidationError(
            {
                "adolescentes": (
                    "No hay adolescentes confirmados. Para rechazar toda la "
                    "solicitud use la acción de rechazo."
                )
            }
        )

    familiares_recibidos: set[int] = set()
    for familiar_data in familiares_data:
        familiar_id = familiar_data.get("id_familiar")
        if familiar_id is not None:
            if familiar_id in familiares_recibidos:
                raise ValidationError(
                    {"familiares_validados": f"El familiar {familiar_id} fue enviado más de una vez."}
                )
            familiares_recibidos.add(familiar_id)

    if se_informaron_decisiones_familiares:
        familiares_rechazados = set(familiares_rechazados_ids)
        if len(familiares_rechazados) != len(familiares_rechazados_ids):
            raise ValidationError({
                "familiares_rechazados": (
                    "Un familiar no puede rechazarse más de una vez."
                )
            })

        familiares_solicitud = set(
            solicitud.familiares.values_list("id", flat=True)
        )
        familiares_desconocidos = (
            familiares_recibidos | familiares_rechazados
        ) - familiares_solicitud
        if familiares_desconocidos:
            raise ValidationError({
                "familiares_validados": (
                    "Hay familiares que no pertenecen a la solicitud: "
                    + ", ".join(str(id_) for id_ in sorted(familiares_desconocidos))
                )
            })

        repetidos = familiares_recibidos & familiares_rechazados
        if repetidos:
            raise ValidationError({
                "familiares_validados": (
                    "Un familiar no puede confirmarse y rechazarse a la vez: "
                    + ", ".join(str(id_) for id_ in sorted(repetidos))
                )
            })

        familiares_sin_decision = familiares_solicitud - (
            familiares_recibidos | familiares_rechazados
        )
        if familiares_sin_decision:
            raise ValidationError({
                "familiares_validados": (
                    "Faltan decisiones para los familiares: "
                    + ", ".join(str(id_) for id_ in sorted(familiares_sin_decision))
                )
            })

    for familiar_data in familiares_data:
        validar_familiar(
            adolescente=None,
            persona_adolescente=None,
            personas_adolescentes=personas_adolescentes,
            solicitud=solicitud,
            data=familiar_data,
        )

    descripcion_extra = data.pop("descripcion_extra", None)
    if descripcion_extra is not None:
        solicitud.descripcion_extra = descripcion_extra

    solicitud.validado = True
    solicitud.equipo_id = ID_ADMISION
    solicitud.fecha_hora_entrada = timezone.now()
    solicitud.save()

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

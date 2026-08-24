from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import Solicitud, Archivo
from src.apps.domicilio.models import Institucion
from src.apps.domicilio.services import crear_institucion 
from src.models import Equipo
from src.apps.persona.services import (crear_adolescente, validar_adolescente, validar_hermano, validar_familiar)
from src.utils import enviar_correo
from django.core.files.uploadedfile import UploadedFile

ID_ENTRADA  = 1
ID_ADMISION = 2

@transaction.atomic
def crear_solicitud(datos_solicitud: dict, archivos: list[UploadedFile] | None = None) -> Solicitud:

    adolescente_data = datos_solicitud.pop("adolescente")
    institucion_data = datos_solicitud.pop("institucion", None)

    correo = datos_solicitud.get("correo")
    telefono = datos_solicitud.get("telefono")

    institucion_obj = None
    if isinstance(institucion_data, dict):
        institucion_obj = crear_institucion(institucion_data)
        
    elif isinstance(institucion_data, Institucion):
        institucion_obj = institucion_data
        institucion_obj.save()
    print("ANTES")
    adolescente_obj = crear_adolescente(adolescente_data)
    print(adolescente_obj)
    datos_solicitud["institucion"] = institucion_obj
    datos_solicitud["adolescente"] = adolescente_obj
    
    datos_solicitud["fecha_hora_creacion"] = timezone.now()
    datos_solicitud["validado"] = False
    datos_solicitud["rechazado"] = False

    solicitud = Solicitud.objects.create(equipo_id=ID_ENTRADA, **datos_solicitud)

    if archivos:
        for file in archivos:
            Archivo.objects.create(
                solicitud=solicitud,
                nombre=file.name,
                tipo_mime=file.content_type,
                contenido=file.read(),
            )

    if solicitud.correo:
        enviar_correo(
            subject="FORMULARIO PROBLEMÁTICA",
            body="La solicitud fue enviada correctamente.",
            to_emails=[solicitud.correo],
        )

    return solicitud


@transaction.atomic
def validar_solicitud(solicitud: Solicitud, data: dict) -> Solicitud:
    if solicitud.validado or solicitud.rechazado:
        raise ValidationError({"error": "La solicitud ya fue procesada."})
    
    data = data.copy()

    adolescente_data = data.pop("adolescente", None)

    if adolescente_data:
        persona_adolescente = validar_adolescente(
            adolescente=solicitud.adolescente,
            data=adolescente_data.get("adolescente_validado"), 
        )

        for hermano_data in adolescente_data.get("hermanos_validados", []):
            validar_hermano(
                adolescente=solicitud.adolescente,
                persona_adolescente=persona_adolescente,
                data=hermano_data,
            )

        for familiar_data in adolescente_data.get("familiares_validados", []):
            validar_familiar(
                adolescente=solicitud.adolescente,
                persona_adolescente=persona_adolescente,
                data=familiar_data,
            )

    for campo, valor in data.items():
        setattr(solicitud, campo, valor)

    solicitud.validado = True
    solicitud.equipo_id = ID_ADMISION
    solicitud.save()

    if solicitud.correo:
        enviar_correo(
            subject="FORMULARIO PROBLEMÁTICA",
            body="Su solicitud fue aprobada.",
            to_emails=[solicitud.correo],
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
        enviar_correo(
            subject="FORMULARIO PROBLEMÁTICA",
            body=(
                "Su solicitud fue rechazada. "
                "A continuación se detallan los motivos.\n\n"
                f"{motivo}"
            ),
            to_emails=[solicitud.correo],
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
        enviar_correo(
            subject="FORMULARIO PROBLEMÁTICA",
            body=(
                "Su solicitud fue derivada al siguiente equipo: "
                f"{equipo.nombre}"
            ),
            to_emails=[solicitud.correo],
        )

    return solicitud
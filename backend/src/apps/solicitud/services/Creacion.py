"""Creación transaccional de la solicitud y asociaciones del formulario."""
from pathlib import Path
from django.db import transaction
from django.utils import timezone
from django.core.files.uploadedfile import UploadedFile
from rest_framework.exceptions import ValidationError
from src.apps.persona.models import RelacionAdolescente
from src.apps.persona.services import crear_adolescente
from src.apps.domicilio.models import Institucion
from src.apps.domicilio.services import crear_institucion
from ..models import Solicitud, Archivo
from ..constantes import ID_ENTRADA
from ..copia_formulario import capturar_formulario
from .Notificaciones import _confirmar_solicitud_por_correo


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
        copia = capturar_formulario(solicitud)
        correo = solicitud.correo
        transaction.on_commit(
            lambda: _confirmar_solicitud_por_correo(copia, correo)
        )

    return solicitud

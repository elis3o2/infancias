"""Reglas de adjuntos, almacenamiento y visibilidad de archivos."""
from pathlib import Path

from django.core.files.uploadedfile import UploadedFile
from rest_framework.exceptions import ValidationError

from ..models import Archivo, Solicitud


MAX_ARCHIVOS = 5
MAX_TAMANO_ARCHIVO = 10 * 1024 * 1024
MAX_TAMANO_TOTAL = 30 * 1024 * 1024
TIPOS_ARCHIVO_PERMITIDOS = {"application/pdf", "image/jpeg", "image/png"}
EXTENSIONES_ARCHIVO_PERMITIDAS = {".pdf", ".jpg", ".jpeg", ".png"}


def validar_archivos(archivos):
    if len(archivos) > MAX_ARCHIVOS:
        raise ValidationError(
            {"archivos": f"Puede adjuntar como máximo {MAX_ARCHIVOS} archivos."}
        )

    total = 0
    for archivo in archivos:
        nombre = Path(archivo.name).name
        extension = Path(nombre).suffix.lower()
        tipo_mime = (archivo.content_type or "").lower()

        if extension not in EXTENSIONES_ARCHIVO_PERMITIDAS:
            raise ValidationError(
                {"archivos": f"El archivo {nombre} no tiene un formato permitido."}
            )
        if (
            tipo_mime
            and tipo_mime != "application/octet-stream"
            and tipo_mime not in TIPOS_ARCHIVO_PERMITIDOS
        ):
            raise ValidationError(
                {"archivos": f"El tipo informado para {nombre} no está permitido."}
            )
        if archivo.size > MAX_TAMANO_ARCHIVO:
            raise ValidationError(
                {"archivos": f"El archivo {nombre} supera el máximo de 10 MB."}
            )

        total += archivo.size

    if total > MAX_TAMANO_TOTAL:
        raise ValidationError(
            {"archivos": "El total de archivos no puede superar los 30 MB."}
        )


def guardar_archivos(solicitud: Solicitud, archivos: list[UploadedFile]) -> None:
    for archivo in archivos:
        Archivo.objects.create(
            solicitud=solicitud, nombre=Path(archivo.name).name,
            tipo_mime=archivo.content_type, contenido=archivo.read(),
        )


def archivos_visibles(usuario):
    if not getattr(usuario, "equipo_id", None):
        return Archivo.objects.none()
    return Archivo.objects.filter(solicitud__equipo_id=usuario.equipo_id)

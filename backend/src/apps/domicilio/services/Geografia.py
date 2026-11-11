"""Traducción de la información geográfica externa a referencias locales."""
import logging
from django.db import transaction
from src.apps.api_externa.services import ServicioExternoError, obtener_direccion_geo
from ..models import DomicilioValidado, Distrito, Vecinal, Barrio, SeccionalPolicial, IdentidadBarrial

logger = logging.getLogger(__name__)


@transaction.atomic
def crear_domicilio_validado(datos: dict) -> DomicilioValidado:

    try:
        informacion_geo = obtener_direccion_geo(
            codigo_calle=datos["codigo_calle"],
            altura=datos["altura"],
            bis=datos["bis"],
            letra=datos.get("letra"),
        )
    except ServicioExternoError as exc:
        logger.warning("No fue posible consultar API_GEO2: %s", exc)
        informacion_geo = {}

    relaciones = {
        "distrito": Distrito,
        "vecinal": Vecinal,
        "barrio": Barrio,
        "seccional_policial": SeccionalPolicial,
        "identidad_barrial": IdentidadBarrial,
    }

    for campo, modelo in relaciones.items():
        valor = informacion_geo.get(campo)

        if valor is None:
            continue

        objeto, _ = modelo.objects.get_or_create(
            id=valor["id"],
            defaults={
                "nombre": valor["nombre"],
            },
        )

        informacion_geo[campo] = objeto

    return DomicilioValidado.objects.create(
        codigo_calle=datos["codigo_calle"],
        altura=datos["altura"],
        bis=datos["bis"],
        letra=datos.get("letra"),
        nombreInterseccion=datos.get("nombreInterseccion"),
        codigoInterseccion=datos.get("codigoInterseccion"),
        coordenada_x=datos.get("coordenada_x"),
        coordenada_y=datos.get("coordenada_y"),
        latitud=datos.get("latitud"),
        longitud=datos.get("longitud"),

        distrito=informacion_geo.get("distrito"),
        vecinal=informacion_geo.get("vecinal"),
        barrio=informacion_geo.get("barrio"),
        seccional_policial=informacion_geo.get("seccional_policial"),

        fraccion_censal=informacion_geo.get("fraccion_censal"),
        radio_censal=informacion_geo.get("radio_censal"),
        zona_notificacion=informacion_geo.get("zona_notificacion"),

        identidad_barrial=informacion_geo.get("identidad_barrial"),
        localidad=informacion_geo.get("localidad"),

        puntoX=informacion_geo.get("puntoX"),
        puntoY=informacion_geo.get("puntoY"),
    )


def obtener_direccion(
    codigo_calle: int,
    altura: int,
    bis: bool,
    letra: str | None = None,
) -> dict:
    """Compatibilidad para llamados antiguos del módulo domicilio."""
    try:
        return obtener_direccion_geo(
            codigo_calle=codigo_calle,
            altura=altura,
            bis=bis,
            letra=letra,
        )
    except ServicioExternoError as exc:
        logger.warning("No fue posible consultar API_GEO2: %s", exc)
        return {}

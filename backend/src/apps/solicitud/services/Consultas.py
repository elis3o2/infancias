"""Lectura de solicitudes: visibilidad, filtros y preparación de datos.

Los adaptadores no necesitan conocer las relaciones ni las optimizaciones del ORM.
"""
from django.db.models import Prefetch, QuerySet
from django.db.models.functions import Coalesce

from src.apps.persona.models import Adolescente, RelacionAdolescente
from ..models import Solicitud, SolicitudComentario
from .Acceso import filtrar_solicitudes_visibles


def obtener_solicitudes(queryset: QuerySet[Solicitud], usuario, accion: str, *, desde=None, hasta=None) -> QuerySet[Solicitud]:
    queryset = filtrar_solicitudes_visibles(queryset, usuario, accion)
    queryset = queryset.annotate(
        fecha_orden=Coalesce("fecha_hora_entrada", "fecha_hora_creacion"),
    ).order_by("-fecha_orden", "-id")
    estados = {
        "sin_validar": {"validado": False, "rechazado": False},
        "validados": {"validado": True, "rechazado": False},
        "rechazados": {"rechazado": True},
    }
    queryset = queryset.filter(**estados.get(accion, {}))
    if desde:
        queryset = queryset.filter(fecha_orden__date__gte=desde)
    if hasta:
        queryset = queryset.filter(fecha_orden__date__lte=hasta)

    if accion in {"list", "validados", "sin_validar", "rechazados"}:
        queryset = queryset.select_related("motivo", "equipo").prefetch_related(Prefetch(
            "adolescentes",
            queryset=Adolescente.objects.select_related("persona__legajo__carpeta").order_by("id"),
        ))
    if accion == "retrieve":
        queryset = queryset.prefetch_related(Prefetch(
            "comentarios",
            queryset=SolicitudComentario.objects.select_related("usuario").order_by("fecha_hora_creacion", "id"),
        ))
    return queryset


def relaciones_solicitud(solicitud: Solicitud):
    return RelacionAdolescente.objects.filter(
        adolescente1__solicitud=solicitud, adolescente2__solicitud=solicitud,
    ).select_related("vinculo").order_by("id")


def familiares_validados_solicitud(solicitud: Solicitud):
    familiares = solicitud.familiares.filter(persona__isnull=False).select_related(
        "persona__legajo__carpeta",
    ).order_by("id")
    personas = []
    ids_personas = set()
    for familiar in familiares:
        if familiar.persona_id not in ids_personas:
            ids_personas.add(familiar.persona_id)
            personas.append(familiar.persona)
    return personas


def titulo_solicitud(solicitud: Solicitud) -> str:
    if solicitud.fecha_hora_admision is None:
        return solicitud.motivo.nombre
    nombres = []
    for adolescente in solicitud.adolescentes.all():
        persona = adolescente.persona or adolescente
        nombre = f"{persona.nombre} {persona.apellido}".strip()
        dni = str(persona.dni).strip() if persona.dni else ""
        if nombre or dni:
            nombres.append(f"{nombre} (DNI: {dni})" if nombre and dni else nombre or f"DNI: {dni}")
    return " · ".join(nombres) or f"Solicitud #{solicitud.pk}"


def legajos_solicitud(solicitud):
    if not solicitud.validado:
        return []
    resultado = []
    for adolescente in solicitud.adolescentes.all():
        persona = adolescente.persona
        if persona is None:
            continue
        legajo = persona.legajo
        resultado.append({
            "id_adolescente": adolescente.pk,
            "nombre": f"{persona.nombre} {persona.apellido}".strip(),
            "legajo": legajo.numero if legajo else None,
            "carpeta": legajo.carpeta.numero if legajo else None,
        })
    return resultado

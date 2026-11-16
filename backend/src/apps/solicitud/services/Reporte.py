"""Indicadores y detalle de reportes, independientes de la paginación HTTP."""
from datetime import datetime, time, timedelta

from django.conf import settings
from django.db.models import Count, Prefetch, Q
from django.utils import timezone

from src.models import Equipo
from src.apps.persona.models import Adolescente
from ..clases import ResultadoReporte
from ..models import Solicitud, SolicitudComentario


def _fecha_actual():
    ahora = timezone.now()
    return timezone.localtime(ahora).date() if timezone.is_aware(ahora) else ahora.date()


def _inicio_dia(fecha):
    inicio = datetime.combine(fecha, time.min)
    return timezone.make_aware(inicio) if settings.USE_TZ else inicio


def _en_periodo(consulta, desde, hasta):
    # Límite superior exclusivo: incluye todo el último día, no solo su medianoche.
    return consulta.filter(
        fecha_hora_creacion__gte=_inicio_dia(desde),
        fecha_hora_creacion__lt=_inicio_dia(hasta + timedelta(days=1)),
    )


def _periodo_reporte(filtros, hoy):
    periodo = filtros["periodo"]
    if periodo == "todo":
        return None, None
    if periodo == "personalizado":
        return filtros["desde"], filtros["hasta"]
    if periodo == "mes":
        desde = hoy.replace(day=1)
        siguiente = (desde + timedelta(days=32)).replace(day=1)
        return desde, siguiente - timedelta(days=1)
    desde = hoy - timedelta(days=hoy.weekday())
    return desde, desde + timedelta(days=6)


def _resumen_general(hoy):
    desde = hoy - timedelta(days=hoy.weekday())
    hasta = desde + timedelta(days=6)
    solicitudes = Solicitud.objects.all()
    resumen = solicitudes.aggregate(
        total=Count("id"),
        pendientes=Count("id", filter=Q(validado=False, rechazado=False)),
    )
    equipos = list(Equipo.objects.annotate(
        total=Count("solicitud", filter=Q(solicitud__rechazado=False)),
    ).values("id", "nombre", "total").order_by("nombre", "id"))
    # Grupo virtual para el reporte: conserva el equipo real guardado en la solicitud.
    equipos.append({"id": "rechazadas", "nombre": "Rechazadas", "total": solicitudes.filter(rechazado=True).count()})
    resumen.update(
        ingresadas_semana=_en_periodo(solicitudes, desde, hasta).count(),
        semana_desde=desde, semana_hasta=hasta,
        equipos=equipos,
    )
    return resumen


def _solicitudes_reporte(filtros, desde, hasta):
    consulta = Solicitud.objects.all()
    if desde is not None:
        consulta = _en_periodo(consulta, desde, hasta)
    if filtros.get("equipo") == "rechazadas":
        consulta = consulta.filter(rechazado=True)
    elif filtros.get("equipo"):
        consulta = consulta.filter(equipo_id=filtros["equipo"], rechazado=False)
    if filtros.get("solicitud"):
        consulta = consulta.filter(pk=filtros["solicitud"])
    estado = filtros.get("estado")
    if estado == "rechazada":
        consulta = consulta.filter(rechazado=True)
    elif estado == "validada":
        consulta = consulta.filter(validado=True, rechazado=False)
    elif estado == "pendiente":
        consulta = consulta.filter(validado=False, rechazado=False)
    return consulta


def _resumen_filtrado(consulta):
    resumen = consulta.aggregate(
        total=Count("id"),
        pendientes=Count("id", filter=Q(validado=False, rechazado=False)),
        validadas=Count("id", filter=Q(validado=True, rechazado=False)),
        rechazadas=Count("id", filter=Q(rechazado=True)),
    )
    # Cuenta comentarios de las solicitudes seleccionadas, sin multiplicar solicitudes
    # por la cantidad de adolescentes o de intervenciones que tengan.
    resumen["intervenciones"] = SolicitudComentario.objects.filter(solicitud__in=consulta).count()
    resumen["motivos"] = list(consulta.values("motivo__nombre").annotate(total=Count("id")).order_by("-total", "motivo__nombre"))
    return resumen


def obtener_reporte_solicitudes(filtros: dict) -> ResultadoReporte:
    hoy = _fecha_actual()
    desde, hasta = _periodo_reporte(filtros, hoy)
    consulta = _solicitudes_reporte(filtros, desde, hasta)
    detalle = consulta.select_related("equipo", "motivo").annotate(
        cantidad_adolescentes=Count("adolescentes", distinct=True),
        cantidad_comentarios=Count("comentarios", distinct=True),
    ).prefetch_related(Prefetch(
        "adolescentes",
        queryset=Adolescente.objects.select_related("persona__legajo__carpeta").order_by("id"),
    )).order_by("-fecha_hora_creacion", "-id")
    return ResultadoReporte(
        general=_resumen_general(hoy), desde=desde, hasta=hasta,
        resumen=_resumen_filtrado(consulta), solicitudes=detalle,
    )

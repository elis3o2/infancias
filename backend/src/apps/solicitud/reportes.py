from datetime import datetime, time, timedelta

from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone

from src.models import Equipo
from .models import Solicitud, SolicitudComentario


def fecha_actual():
    ahora = timezone.now()
    return timezone.localtime(ahora).date() if timezone.is_aware(ahora) else ahora.date()


def inicio_dia(fecha):
    inicio = datetime.combine(fecha, time.min)
    return timezone.make_aware(inicio) if settings.USE_TZ else inicio


def en_periodo(consulta, desde, hasta):
    # Límite superior exclusivo: incluye todo el último día, no solo su medianoche.
    return consulta.filter(
        fecha_hora_creacion__gte=inicio_dia(desde),
        fecha_hora_creacion__lt=inicio_dia(hasta + timedelta(days=1)),
    )


def periodo_reporte(filtros, hoy):
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


def resumen_general(hoy):
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
        ingresadas_semana=en_periodo(solicitudes, desde, hasta).count(),
        semana_desde=desde, semana_hasta=hasta,
        equipos=equipos,
    )
    return resumen


def solicitudes_reporte(filtros, desde, hasta):
    consulta = Solicitud.objects.all()
    if desde is not None:
        consulta = en_periodo(consulta, desde, hasta)
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


def resumen_filtrado(consulta):
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

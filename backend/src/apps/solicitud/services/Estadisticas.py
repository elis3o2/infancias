from datetime import timedelta

from django.db.models import Count
from django.utils import timezone


def contar_por_equipo(queryset):
    resultados = (
        queryset
        .values("equipo__nombre")
        .annotate(cantidad=Count("id"))
        .order_by()
    )

    return {
        item["equipo__nombre"]: item["cantidad"]
        for item in resultados
    }


def creadas_semana(queryset, ahora):
    inicio_semana = (
        ahora - timedelta(days=ahora.weekday())
    ).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    return contar_por_equipo(
        queryset.filter(fecha_hora_creacion__gte=inicio_semana)
    )


def creadas_mes(queryset, ahora):
    inicio_mes = ahora.replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    return contar_por_equipo(
        queryset.filter(fecha_hora_creacion__gte=inicio_mes)
    )


def total(queryset, ahora):
    return contar_por_equipo(queryset)


ESTADISTICAS = {
    "creada_semana": creadas_semana,
    "creada_mes": creadas_mes,
    "total": total,
}


def generar_reporte(queryset):
    ahora = timezone.now()
    if timezone.is_aware(ahora):
        ahora = timezone.localtime(ahora)

    return {
        nombre: funcion(queryset, ahora)
        for nombre, funcion in ESTADISTICAS.items()
    }

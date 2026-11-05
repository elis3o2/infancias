from django.db.models import F, IntegerField, Max, OuterRef, Prefetch, Subquery
from django.db.models.functions import Coalesce

from src.apps.solicitud.models import Solicitud, SolicitudComentario
from .models import Adolescente, Legajo, Persona


def registros_identificados():
    return Adolescente.objects.annotate(
        dni_identidad=Coalesce("persona__dni", "dni"),
        sexo_identidad=Coalesce("persona__sexo", "sexo"),
    ).exclude(dni_identidad="").exclude(sexo_identidad="")


def ninos_historial():
    """Una fila por DNI y sexo, incluyendo niños aún no validados."""
    registros = registros_identificados()
    ultimos = registros.order_by().values("dni_identidad", "sexo_identidad").annotate(
        ultimo=Max("id"),
    ).values("ultimo")
    personas = Persona.objects.filter(
        dni=OuterRef("dni_identidad"), sexo=OuterRef("sexo_identidad"),
    ).order_by("id")
    # Una solicitud más reciente puede seguir pendiente aunque la persona
    # ya haya sido validada en otra. En ambos casos prima su identidad validada.
    return registros.filter(pk__in=Subquery(ultimos)).annotate(
        persona_actual_id=Coalesce("persona_id", Subquery(personas.values("id")[:1]), output_field=IntegerField()),
        nombre_actual=Coalesce("persona__nombre", Subquery(personas.values("nombre")[:1]), "nombre"),
        apellido_actual=Coalesce("persona__apellido", Subquery(personas.values("apellido")[:1]), "apellido"),
        nacimiento_actual=Coalesce("persona__fecha_nacimiento", Subquery(personas.values("fecha_nacimiento")[:1]), "fecha_nacimiento"),
        legajo_actual_id=Coalesce("persona__legajo_id", Subquery(personas.values("legajo_id")[:1]), output_field=IntegerField()),
    ).annotate(
        numero_legajo=Subquery(Legajo.objects.filter(pk=OuterRef("legajo_actual_id")).annotate(
            numero=Coalesce("id_insert", "id", output_field=IntegerField()),
        ).values("numero")[:1]),
    )


def buscar_ninos(filtros: dict):
    consulta = ninos_historial()
    for campo in ("nombre", "apellido"):
        if filtros.get(campo):
            consulta = consulta.filter(**{f"{campo}_actual__icontains": filtros[campo]})
    if filtros.get("dni"):
        consulta = consulta.filter(dni_identidad=filtros["dni"])
    if filtros.get("legajo"):
        consulta = consulta.filter(numero_legajo=filtros["legajo"])
    return consulta.order_by("apellido_actual", "nombre_actual", "dni_identidad", "sexo_identidad", "id")


def datos_nino(adolescente) -> dict:
    return {
        "id": adolescente.pk,
        "nombre": adolescente.nombre_actual,
        "apellido": adolescente.apellido_actual,
        "dni": adolescente.dni_identidad,
        "sexo": adolescente.sexo_identidad,
        "fecha_nacimiento": adolescente.nacimiento_actual,
        "legajo": adolescente.numero_legajo,
        "validado": adolescente.persona_actual_id is not None,
    }


def solicitudes_del_nino(adolescente):
    ids = registros_identificados().filter(
        dni_identidad=adolescente.dni_identidad, sexo_identidad=adolescente.sexo_identidad,
    ).values("solicitud_id")
    # Este historial es transversal a equipos. No modifica los permisos de
    # las vistas operativas para validar, derivar o editar comentarios.
    return Solicitud.objects.filter(pk__in=Subquery(ids)).select_related("equipo", "motivo").prefetch_related(
        Prefetch("comentarios", queryset=SolicitudComentario.objects.select_related("usuario").order_by(
            "-fecha_hora_creacion", "-id",
        )),
    ).order_by(F("fecha_hora_creacion").desc(), "-id")

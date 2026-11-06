from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied, ValidationError

from src.apps.persona.models import Adolescente, Familiar, RelacionAdolescente
from src.apps.persona.services import (
    actualizar_telefono, crear_adolescente, resolver_legajos_solicitud,
    validar_adolescente, validar_familiar,
)
from .models import Solicitud
from .permissions import puede_agregar_familiares, puede_gestionar_admision


def _solicitud_en_admision(solicitud: Solicitud, usuario) -> Solicitud:
    solicitud = Solicitud.objects.select_for_update().get(pk=solicitud.pk)
    if not puede_gestionar_admision(solicitud, usuario):
        raise PermissionDenied("Solo se pueden agregar personas a solicitudes validadas que estén en admisión.")
    return solicitud


def _adolescente_vinculado(solicitud: Solicitud, adolescente_id: int) -> Adolescente:
    adolescente = solicitud.adolescentes.select_related("persona").filter(pk=adolescente_id).first()
    if adolescente is None or adolescente.persona_id is None:
        raise ValidationError({"id_adolescente": "Seleccione un adolescente validado de esta solicitud."})
    return adolescente


def _identidad(datos: dict) -> Q:
    return Q(dni=datos["dni"], sexo=datos["sexo"]) | Q(
        persona__dni=datos["dni"], persona__sexo=datos["sexo"],
    )


@transaction.atomic
def agregar_familiar(solicitud: Solicitud, usuario, datos: dict) -> Solicitud:
    solicitud = Solicitud.objects.select_for_update().get(pk=solicitud.pk)
    if not puede_agregar_familiares(solicitud, usuario):
        raise PermissionDenied("Solo Entrada y Admisión pueden agregar familiares a solicitudes validadas y no rechazadas.")
    adolescente = _adolescente_vinculado(solicitud, datos["id_adolescente"])
    if adolescente.familiares.filter(_identidad(datos["persona"])).exists():
        raise ValidationError({"persona": "El familiar ya está vinculado a este adolescente."})
    familiar = Familiar(solicitud=solicitud, adolescente=adolescente)
    validar_familiar(familiar, datos, adolescente.persona)
    return solicitud


@transaction.atomic
def agregar_adolescente(solicitud: Solicitud, usuario, datos: dict) -> Solicitud:
    solicitud = _solicitud_en_admision(solicitud, usuario)
    vinculado = _adolescente_vinculado(solicitud, datos["id_adolescente"])
    if solicitud.adolescentes.filter(_identidad(datos["persona"])).exists():
        raise ValidationError({"persona": "El adolescente ya pertenece a esta solicitud."})
    if not datos["vinculo"].adolescente:
        raise ValidationError({"id_vinculo": "El vínculo debe ser de tipo adolescente."})

    existentes = list(solicitud.adolescentes.select_related("persona__legajo__carpeta"))
    if any(adolescente.persona_id is None for adolescente in existentes):
        raise ValidationError({"adolescentes": "Hay adolescentes sin validar en esta solicitud."})

    datos_persona = datos["persona"]
    adolescente = crear_adolescente({
        campo: datos_persona[campo]
        for campo in ("dni", "sexo", "nombre", "apellido", "fecha_nacimiento")
    } | {"domicilio": datos["domicilio"]}, solicitud)
    persona = validar_adolescente(adolescente, datos_persona)
    actualizar_telefono(persona, datos.get("telefono"))
    RelacionAdolescente.objects.create(
        adolescente1=vinculado, adolescente2=adolescente, vinculo=datos["vinculo"],
    )
    resolver_legajos_solicitud([
        *((actual.persona, None) for actual in existentes),
        (persona, datos.get("legajo")),
    ])
    return solicitud

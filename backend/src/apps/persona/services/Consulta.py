"""Antecedentes locales e identidad externa, sin mutar personas ni filtrar por equipo."""
from django.db.models import Q
from src.apps.api_externa.services import consultar_digitalizacion
from src.apps.solicitud.models import Solicitud
from ..models import Persona, Relacion
from .Persona import buscar_persona


def _serializar_persona_consulta(persona: Persona | None) -> dict | None:
    if persona is None:
        return None

    return {
        "nombre": persona.nombre,
        "apellido": persona.apellido,
        "sexo": persona.sexo,
        "fecha_nacimiento": persona.fecha_nacimiento,
        "dni": persona.dni,
        "legajo": persona.legajo.numero if persona.legajo_id else None,
        "carpeta": (
            persona.legajo.carpeta.numero
            if persona.legajo_id and persona.legajo.carpeta_id
            else None
        ),
        "hc": persona.hc,
        "hcf": persona.hcf,
        "discapacidades": persona.discapacidades,
        "consumos_problematicos": persona.consumos_problematicos,
        "intentos_de_suicidio": persona.intentos_de_suicidio,
        "problemas_socioambientales": persona.problemas_socioambientales,
        "violencias": persona.violencias,
    }


def consultar_adolescente(data):

    dni = data["dni"]
    sexo = data["sexo"]

    persona = buscar_persona(dni=dni, sexo=sexo)

    ciudadano = None

    if not persona:
        ciudadano = consultar_digitalizacion(dni=dni, sexo=sexo)

    relaciones = []

    if persona:
        relaciones = consultar_relaciones(persona)

    return {
        "id": data["id"],

        "solicitudes": consultar_solicitudes(
            persona=persona,
            dni=dni,
            sexo=sexo
        ),

        "persona": _serializar_persona_consulta(persona),
        "ciudadano": ciudadano if ciudadano is not None else None,
        "relaciones": relaciones,
    }


def consultar_relaciones(persona):

    relaciones = Relacion.objects.filter(
        Q(persona_1=persona) | Q(persona_2=persona)
    ).select_related(
        "vinculo",
        "persona_1",
        "persona_2",
    )

    resultado = []

    for relacion in relaciones:

        persona_relacionada = (
            relacion.persona_2
            if relacion.persona_1_id == persona.id
            else relacion.persona_1
        )

        resultado.append({
            "vinculo": relacion.vinculo.nombre,
            "persona": {
                "nombre": persona_relacionada.nombre,
                "apellido": persona_relacionada.apellido,
                "dni": persona_relacionada.dni,
                "sexo": persona_relacionada.sexo,
            }
        })

    return resultado


def consultar_solicitudes(
    persona: Persona | None,
    dni=None,
    sexo=None
):

    if persona is None:
        return []

    solicitudes = Solicitud.objects.filter(
        adolescentes__persona=persona,
        rechazado=False
    )

    solicitudes = solicitudes.select_related(
        "equipo",
        "motivo",
    ).distinct()

    return [
        {
            "id": solicitud.id,
            "fecha_creacion": solicitud.fecha_hora_creacion,
            "equipo": solicitud.equipo.nombre if solicitud.equipo_id else None,
            "motivo": solicitud.motivo.nombre if solicitud.motivo_id else None,
        }
        for solicitud in solicitudes
    ]


def consultar_familiar(data):

    dni = data["dni"]
    sexo = data["sexo"]

    persona = buscar_persona(dni=dni, sexo=sexo)
    ciudadano = None

    if not persona:
        ciudadano = consultar_digitalizacion(dni=dni, sexo=sexo)

    return {
        "id": data["id"],
        "persona": _serializar_persona_consulta(persona),
        "ciudadano": ciudadano if ciudadano is not None else None,
        "relaciones": consultar_relaciones(persona) if persona else [],
    }

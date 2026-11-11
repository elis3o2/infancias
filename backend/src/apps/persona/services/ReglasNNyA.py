"""Alta y validación del adolescente, sus familiares y referencias institucionales."""
from django.db import transaction
from rest_framework.exceptions import ValidationError
from src.apps.domicilio.models import Institucion
from src.apps.domicilio.services import crear_domicilio
from src.apps.solicitud.models import Solicitud
from ..models import Adolescente, AdolescenteInstitucion, Persona
from .Contacto import actualizar_domicilio
from .Persona import buscar_persona, _actualizar_salud, _crear_persona_validada
from .ReferenciasInstitucion import _resolver_referencia_institucion
from .ReglasFamiliar import crear_familiar


@transaction.atomic
def crear_adolescente(
    datos_adolescente: dict,
    solicitud: Solicitud,
    *,
    referencias_por_temp: dict[str, Institucion] | None = None,
) -> Adolescente:
    datos_adolescente = datos_adolescente.copy()
    domicilio_data = datos_adolescente.pop("domicilio", None)
    datos_adolescente.pop("id_temp", None)
    familiares_data = datos_adolescente.pop("familiares", [])
    referencias_data = datos_adolescente.pop("referencias_instituciones_data", [])

    if domicilio_data is None:
        raise ValidationError({"adolescentes": "El domicilio es obligatorio."})

    domicilio_obj = crear_domicilio(dict(domicilio_data))

    adolescente = Adolescente.objects.create(
        domicilio=domicilio_obj,
        solicitud=solicitud,
        **datos_adolescente,
    )

    for familiar_data in familiares_data:
        crear_familiar(familiar_data, adolescente)

    for referencia_data in referencias_data:
        referencia = _resolver_referencia_institucion(
            referencia_data,
            referencias_por_temp,
        )
        AdolescenteInstitucion.objects.get_or_create(
            adolescente=adolescente, institucion=referencia,
        )

    return adolescente


@transaction.atomic
def validar_adolescente(adolescente: Adolescente, datos: dict) -> Persona:
    if (datos["dni"], datos["sexo"]) != (adolescente.dni, adolescente.sexo):
        raise ValidationError({"persona": "La identidad no coincide con el adolescente de la solicitud."})
    persona = buscar_persona(dni=adolescente.dni, sexo=adolescente.sexo)
    if persona is None:
        persona = _crear_persona_validada(datos)
    else:
        _actualizar_salud(persona, datos)

    if adolescente.persona_id is not None and adolescente.persona_id != persona.id:
        raise ValidationError({"adolescentes": "El adolescente ya tiene otra persona asociada."})

    if adolescente.persona_id != persona.id:
        adolescente.persona = persona
        adolescente.save(update_fields=["persona"])

    actualizar_domicilio(persona, adolescente.domicilio)
    return persona

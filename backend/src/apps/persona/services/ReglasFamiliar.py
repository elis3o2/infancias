"""Alta declarada, validación y vínculo de un familiar con el adolescente."""
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError
from src.apps.domicilio.services import crear_domicilio
from ..models import Adolescente, Familiar, Persona, Relacion
from .Contacto import actualizar_domicilio, actualizar_telefono
from .Persona import buscar_persona, _actualizar_salud, _crear_persona_validada


@transaction.atomic
def crear_familiar(datos_familiar: dict, adolescente: Adolescente) -> Familiar:
    datos_familiar = datos_familiar.copy()
    domicilio_data = datos_familiar.pop("domicilio", None)

    for field in ("telefono", "dni", "sexo"):
        if datos_familiar.get(field) == "":
            datos_familiar[field] = None

    vinculo = datos_familiar.get("vinculo")
    if vinculo is not None and vinculo.adolescente:
        raise ValidationError({"id_vinculo": "El vínculo debe ser de tipo familiar."})

    domicilio_obj = (
        crear_domicilio(dict(domicilio_data))
        if domicilio_data is not None
        else None
    )

    familiar = Familiar.objects.create(
        solicitud=adolescente.solicitud,
        adolescente=adolescente,
        domicilio=domicilio_obj,
        **datos_familiar,
    )

    return familiar


@transaction.atomic
def validar_familiar(
    familiar: Familiar,
    datos: dict,
    adolescente: Persona,
) -> Persona:
    if familiar.adolescente_id is None or familiar.adolescente.persona_id != adolescente.id:
        raise ValidationError({"familiares": "El familiar no pertenece al adolescente indicado."})
    if familiar.solicitud_id != familiar.adolescente.solicitud_id:
        raise ValidationError({"familiares": "La solicitud del familiar no coincide con la del adolescente."})

    datos_persona = datos["persona"]
    dni = datos_persona["dni"]
    sexo = datos_persona["sexo"]
    vinculo = datos["vinculo"]

    if vinculo.adolescente:
        raise ValidationError({"vinculo": "El vínculo debe ser de tipo familiar."})

    persona = buscar_persona(dni=dni, sexo=sexo)
    if persona is None:
        persona = _crear_persona_validada(datos_persona)
    else:
        _actualizar_salud(persona, datos_persona)

    if persona.id == adolescente.id:
        raise ValidationError({"familiares": "El adolescente no puede ser su propio familiar."})
    if familiar.persona_id is not None and familiar.persona_id != persona.id:
        raise ValidationError({"familiares": "El familiar ya tiene otra persona asociada."})

    if datos.get("domicilio") is not None:
        familiar.domicilio = crear_domicilio(datos["domicilio"].copy())
    if "telefono" in datos:
        familiar.telefono = datos["telefono"] or None

    actualizar_domicilio(persona, familiar.domicilio)
    actualizar_telefono(persona, familiar.telefono)

    familiar.persona = persona
    familiar.vinculo = vinculo
    familiar.dni = persona.dni
    familiar.sexo = persona.sexo
    familiar.nombre = persona.nombre
    familiar.apellido = persona.apellido
    familiar.save()

    relacion = Relacion.objects.filter(
        Q(persona_1=adolescente, persona_2=persona)
        | Q(persona_1=persona, persona_2=adolescente),
        vinculo=vinculo,
    ).exists()
    if not relacion:
        Relacion.objects.create(persona_1=adolescente, persona_2=persona, vinculo=vinculo)
    return persona

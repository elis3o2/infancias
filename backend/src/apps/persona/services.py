from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import (
    Persona,
    PersonaDomicilio,
    PersonaTelefono,
    Adolescente,
    Legajo,
    Carpeta,
    Relacion,
    Hermano,
    Familiar,
    Vinculo,
    AdolescenteInstitucion,
)

from src.apps.domicilio.services import (
    crear_domicilio,
    crear_institucion,
)


def buscar_persona(
    dni: str,
    sexo: str,
) -> Persona | None:

    return Persona.objects.filter(
        dni=dni,
        sexo=sexo,
    ).first()


def actualizar_domicilio(
    persona: Persona,
    domicilio,
) -> None:

    if domicilio is None:
        return

    ultimo_domicilio = (
        PersonaDomicilio.objects
        .filter(persona=persona)
        .order_by("-fecha_carga")
        .first()
    )

    if (
        ultimo_domicilio is None
        or ultimo_domicilio.domicilio_id != domicilio.id
    ):
        PersonaDomicilio.objects.create(
            persona=persona,
            domicilio=domicilio,
            fecha_carga=timezone.now(),
        )


def actualizar_telefono(
    persona: Persona,
    telefono: str | None,
) -> None:

    if not telefono:
        return

    telefono_existente = PersonaTelefono.objects.filter(
        persona=persona,
        telefono=telefono,
    ).exists()

    if not telefono_existente:
        PersonaTelefono.objects.create(
            persona=persona,
            telefono=telefono,
            fecha_carga=timezone.now(),
        )


def procesar_datos_persona(
    persona: Persona,
    domicilio_data,
    telefono: str | None,
) -> None:

    if domicilio_data is not None:
        domicilio = crear_domicilio(domicilio_data)

        actualizar_domicilio(
            persona=persona,
            domicilio=domicilio,
        )

    if telefono:
        actualizar_telefono(
            persona=persona,
            telefono=telefono,
        )


@transaction.atomic
def crear_familiar(
    datos_familiar: dict,
    adolescente: Adolescente,
) -> Familiar:

    datos_familiar = datos_familiar.copy()

    domicilio_data = datos_familiar.pop(
        "domicilio",
        None,
    )

    if datos_familiar.get("telefono") == "":
        datos_familiar["telefono"] = None

    if datos_familiar.get("dni") == "":
        datos_familiar["dni"] = None

    domicilio_obj = None

    if domicilio_data:
        domicilio_obj = crear_domicilio(
            domicilio_data
        )

    familiar = Familiar.objects.create(
        adolescente=adolescente,
        domicilio=domicilio_obj,
        **datos_familiar,
    )

    return familiar


@transaction.atomic
def crear_adolescente(
    datos_adolescente: dict,
) -> Adolescente:

    datos_adolescente = datos_adolescente.copy()

    domicilio_data = datos_adolescente.pop(
        "domicilio",
        None,
    )

    hermanos_data = datos_adolescente.pop(
        "hermanos",
        [],
    )

    familiares_data = datos_adolescente.pop(
        "familiares",
        [],
    )

    referencias_data = datos_adolescente.pop(
        "referencias_instituciones_data",
        [],
    )

    domicilio_obj = None

    if domicilio_data:
        domicilio_obj = crear_domicilio(
            domicilio_data
        )

    adolescente = Adolescente.objects.create(
        domicilio=domicilio_obj,
        **datos_adolescente,
    )

    for hermano_data in hermanos_data:

        Hermano.objects.create(
            adolescente=adolescente,
            **hermano_data,
        )

    for familiar_data in familiares_data:

        crear_familiar(
            familiar_data,
            adolescente,
        )

    for referencia_data in referencias_data:

        referencia_data = referencia_data.copy()

        institucion = referencia_data.pop(
            "id",
            None,
        )

        if institucion is None:
            institucion = crear_institucion(
                referencia_data
            )

        AdolescenteInstitucion.objects.create(
            adolescente=adolescente,
            institucion=institucion,
        )

    return adolescente


def resolver_legajo(
    legajo_data=None,
    carpeta_data=None,
    carpeta_adolescente=None,
    familiar=False,
) -> Legajo:

    """
    Adolescente:
        - puede recibir legajo externo
        - puede recibir carpeta externa
        - puede recibir ambos
        - puede no recibir ninguno

    Hermano:
        - puede recibir legajo externo
        - utiliza la carpeta del adolescente

    Familiar:
        - siempre crea legajo nuevo
        - letra C
        - id_insert NULL
        - utiliza la carpeta del adolescente
    """

    # =====================================================
    # FAMILIAR
    # =====================================================

    if familiar:

        if carpeta_adolescente is None:
            raise ValidationError(
                "No se puede crear el legajo del familiar "
                "sin la carpeta del adolescente."
            )

        return Legajo.objects.create(
            carpeta=carpeta_adolescente,
            id_insert=None,
            letra="C",
        )

    # =====================================================
    # HERMANO
    # =====================================================

    if carpeta_adolescente is not None:

        id_insert_legajo = None

        if legajo_data:
            id_insert_legajo = legajo_data.get(
                "id_insert"
            )

        # Legajo nuevo
        if id_insert_legajo is None:

            return Legajo.objects.create(
                carpeta=carpeta_adolescente,
                id_insert=None,
                letra="B",
            )

        # Legajo externo
        legajo, _ = Legajo.objects.get_or_create(
            id_insert=id_insert_legajo,
            letra="A",
            defaults={
                "carpeta": carpeta_adolescente,
            },
        )

        return legajo

    # =====================================================
    # ADOLESCENTE
    # =====================================================

    id_insert_carpeta = None
    id_insert_legajo = None

    if carpeta_data:
        id_insert_carpeta = carpeta_data.get(
            "id_insert"
        )

    if legajo_data:
        id_insert_legajo = legajo_data.get(
            "id_insert"
        )

    # -----------------------------------------------------
    # Carpeta
    # -----------------------------------------------------

    if id_insert_carpeta is not None:

        carpeta, _ = Carpeta.objects.get_or_create(
            id_insert=id_insert_carpeta,
            letra="A",
        )

    else:

        carpeta = Carpeta.objects.create(
            id_insert=None,
            letra="B",
        )

    # -----------------------------------------------------
    # Legajo
    # -----------------------------------------------------

    if id_insert_legajo is not None:

        legajo, _ = Legajo.objects.get_or_create(
            id_insert=id_insert_legajo,
            letra="A",
            defaults={
                "carpeta": carpeta,
            },
        )

    else:

        legajo = Legajo.objects.create(
            carpeta=carpeta,
            id_insert=None,
            letra="B",
        )

    return legajo


def validar_adolescente(
    adolescente: Adolescente,
    data,
) -> Persona:

    data = data.copy()

    # Campos que NO pertenecen a Persona
    legajo_data = data.pop(
        "legajo",
        None,
    )

    domicilio_data = data.pop(
        "domicilio",
        None,
    )

    telefono = data.pop(
        "telefono",
        None,
    )

    dni = data.get("dni")
    sexo = data.get("sexo")

    if not dni:
        raise ValidationError({
            "adolescente_validado": (
                "El DNI es obligatorio."
            )
        })

    if not sexo:
        raise ValidationError({
            "adolescente_validado": (
                "El sexo es obligatorio."
            )
        })

    persona = buscar_persona(
        dni=dni,
        sexo=sexo,
    )

    legajo = resolver_legajo(
        legajo_data=legajo_data,
    )

    # Persona existente
    if persona is not None:

        for campo, valor in data.items():
            setattr(
                persona,
                campo,
                valor,
            )

        persona.legajo = legajo
        persona.save()

    # Persona nueva
    else:

        try:

            persona = Persona.objects.create(
                legajo=legajo,
                **data,
            )

        except Exception as exc:

            raise ValidationError({
                "adolescente_validado": (
                    "No se pudo crear la Persona: "
                    f"{exc}"
                )
            })

    # Asociar Persona al Adolescente
    if adolescente.persona_id != persona.id:

        adolescente.persona = persona

        adolescente.save(
            update_fields=["persona"]
        )

    # Domicilio y teléfono
    procesar_datos_persona(
        persona=persona,
        domicilio_data=domicilio_data,
        telefono=telefono,
    )

    return persona


def validar_hermano(
    adolescente,
    persona_adolescente,
    data,
) -> Persona:

    data = data.copy()

    hermano_id = data.pop(
        "id_hermano",
        None,
    )

    legajo_data = data.pop(
        "legajo",
        None,
    )

    domicilio_data = data.pop(
        "domicilio",
        None,
    )

    telefono = data.pop(
        "telefono",
        None,
    )

    dni = data.get("dni")
    sexo = data.get("sexo")

    if not dni:
        raise ValidationError({
            "hermanos_validados": (
                "El DNI es obligatorio."
            )
        })

    if not sexo:
        raise ValidationError({
            "hermanos_validados": (
                "El sexo es obligatorio."
            )
        })

    persona_hermano = buscar_persona(
        dni=dni,
        sexo=sexo,
    )

    # Resolver Legajo
    legajo = resolver_legajo(
        legajo_data=legajo_data,
        carpeta_adolescente=(
            adolescente.persona.legajo.carpeta
        ),
    )

    # Persona existente
    if persona_hermano is not None:

        for campo, valor in data.items():
            setattr(
                persona_hermano,
                campo,
                valor,
            )

        persona_hermano.legajo = legajo

        persona_hermano.save()

    # Persona nueva
    else:

        try:

            persona_hermano = Persona.objects.create(
                legajo=legajo,
                **data,
            )

        except Exception as exc:

            raise ValidationError({
                "hermanos_validados": (
                    "No se pudo crear la Persona "
                    "del hermano: "
                    f"{exc}"
                )
            })

    # Domicilio y teléfono
    procesar_datos_persona(
        persona=persona_hermano,
        domicilio_data=domicilio_data,
        telefono=telefono,
    )

    # -----------------------------------------------------
    # Asociar Hermano
    # -----------------------------------------------------

    if hermano_id is not None:

        hermano = Hermano.objects.filter(
            pk=hermano_id,
            adolescente=adolescente,
        ).first()

        if hermano is None:
            raise ValidationError({
                "hermanos_validados": (
                    f"El hermano {hermano_id} "
                    "no pertenece al adolescente."
                )
            })

        if hermano.persona_id is not None:

            raise ValidationError({
                "hermanos_validados": (
                    f"El hermano {hermano_id} "
                    "ya tiene una Persona asociada."
                )
            })

        hermano.persona = persona_hermano

        hermano.save(
            update_fields=["persona"]
        )

    # -----------------------------------------------------
    # Relación
    # -----------------------------------------------------

    Relacion.objects.create(
        persona_1=persona_adolescente,
        persona_2=persona_hermano,
        vinculo_id=1,
    )

    return persona_hermano


def validar_familiar(
    adolescente,
    persona_adolescente,
    data,
) -> Persona:

    data = data.copy()

    familiar_id = data.pop(
        "id_familiar",
        None,
    )

    domicilio_data = data.pop(
        "domicilio",
        None,
    )

    telefono = data.pop(
        "telefono",
        None,
    )

    vinculo_id = data.pop(
        "id_vinculo",
        None,
    )

    dni = data.get("dni")
    sexo = data.get("sexo")

    # -----------------------------------------------------
    # Validar vínculo
    # -----------------------------------------------------

    if vinculo_id is None:

        raise ValidationError({
            "familiares_validados": (
                "El id_vinculo es obligatorio."
            )
        })

    vinculo = Vinculo.objects.filter(
        pk=vinculo_id,
    ).first()

    if vinculo is None:

        raise ValidationError({
            "familiares_validados": (
                f"El vínculo {vinculo_id} "
                "no existe."
            )
        })

    if not dni:
        raise ValidationError({
            "familiares_validados": (
                "El DNI es obligatorio."
            )
        })

    if not sexo:
        raise ValidationError({
            "familiares_validados": (
                "El sexo es obligatorio."
            )
        })

    # -----------------------------------------------------
    # Buscar Persona
    # -----------------------------------------------------

    persona = buscar_persona(
        dni=dni,
        sexo=sexo,
    )

    # Persona existente
    if persona is not None:

        for campo, valor in data.items():
            setattr(
                persona,
                campo,
                valor,
            )

        persona.save()

    # Persona nueva
    else:

        legajo = resolver_legajo(
            carpeta_adolescente=(
                adolescente.persona.legajo.carpeta
            ),
            familiar=True,
        )

        try:

            persona = Persona.objects.create(
                legajo=legajo,
                **data,
            )

        except Exception as exc:

            raise ValidationError({
                "familiares_validados": (
                    "No se pudo crear la Persona "
                    "del familiar: "
                    f"{exc}"
                )
            })

    # -----------------------------------------------------
    # Asociar Familiar existente
    # -----------------------------------------------------

    if familiar_id is not None:

        familiar = Familiar.objects.filter(
            pk=familiar_id,
            adolescente=adolescente,
        ).first()

        if familiar is None:

            raise ValidationError({
                "familiares_validados": (
                    f"El familiar {familiar_id} "
                    "no pertenece al adolescente."
                )
            })

        if (
            familiar.persona_id is not None
            and familiar.persona_id != persona.id
        ):

            raise ValidationError({
                "familiares_validados": (
                    f"El familiar {familiar_id} "
                    "ya tiene una Persona asociada."
                )
            })

        familiar.persona = persona

        familiar.save(
            update_fields=["persona"]
        )

    # -----------------------------------------------------
    # Relación
    # -----------------------------------------------------

    Relacion.objects.create(
        persona_1=persona_adolescente,
        persona_2=persona,
        vinculo=vinculo,
    )

    # -----------------------------------------------------
    # Domicilio y teléfono
    # -----------------------------------------------------

    procesar_datos_persona(
        persona=persona,
        domicilio_data=domicilio_data,
        telefono=telefono,
    )

    return persona
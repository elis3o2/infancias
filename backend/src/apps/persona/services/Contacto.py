"""Historial de domicilios y teléfonos, sin duplicar contactos existentes."""
from django.utils import timezone
from src.apps.domicilio.services import crear_domicilio
from ..models import Persona, PersonaDomicilio, PersonaTelefono


def actualizar_domicilio(persona: Persona, domicilio) -> None:

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


def actualizar_telefono(persona: Persona, telefono: str | None) -> None:

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


def procesar_datos_persona(persona: Persona, domicilio_data, telefono: str | None):
    domicilio = None

    if domicilio_data is not None:
        domicilio = crear_domicilio(dict(domicilio_data))

        actualizar_domicilio(
            persona=persona,
            domicilio=domicilio,
        )

    if telefono:
        actualizar_telefono(
            persona=persona,
            telefono=telefono,
        )

    return domicilio

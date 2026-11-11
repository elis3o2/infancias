"""Persistencia del domicilio declarado y reutilización de su dirección validada."""
from django.db import transaction
from ..models import Domicilio, DomicilioValidado
from .Geografia import crear_domicilio_validado


@transaction.atomic
def crear_domicilio(datos_domicilio: dict) -> Domicilio:
    domicilio_validado_data = datos_domicilio.pop("domicilio_validado", None)
    domicilio_validado_obj = None

    if domicilio_validado_data is not None:
        try:
            # Buscamos si ya existe por sus campos únicos
            domicilio_validado_obj = DomicilioValidado.objects.get(
                codigo_calle=domicilio_validado_data["codigo_calle"],
                altura=domicilio_validado_data["altura"],
                bis=domicilio_validado_data["bis"],
            )
        except DomicilioValidado.DoesNotExist:
            domicilio_validado_obj = crear_domicilio_validado(domicilio_validado_data)

    # Creamos y retornamos el Domicilio
    return Domicilio.objects.create(
        domicilio_validado=domicilio_validado_obj,
        **datos_domicilio,
    )

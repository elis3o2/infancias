"""Alta de instituciones junto con su domicilio."""
from django.db import transaction
from ..models import Institucion
from .Domicilio import crear_domicilio


@transaction.atomic
def crear_institucion(datos_institucion: dict) -> Institucion:
    domicilio_data = datos_institucion.pop("domicilio")
    
    domicilio_obj = crear_domicilio(domicilio_data)

    return Institucion.objects.create(
        domicilio=domicilio_obj,
        **datos_institucion,
    )

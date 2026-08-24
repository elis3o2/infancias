from django.db import transaction
from .models import (DomicilioValidado, Distrito, Vecinal, Barrio, SeccionalPolicial,Institucion, IdentidadBarrial, Domicilio)

@transaction.atomic
def crear_domicilio_validado(datos_domicilio_validado: dict) -> DomicilioValidado:
    
    relaciones = {
        "distrito": Distrito,
        "vecinal": Vecinal,
        "barrio": Barrio,
        "seccional_policial": SeccionalPolicial,
        "identidad_barrial": IdentidadBarrial,
    }

    # Iteramos sobre las relaciones para extraerlas del diccionario principal
    for campo, modelo in relaciones.items():
        data = datos_domicilio_validado.pop(campo, None)

        if data is not None:
            objeto, _ = modelo.objects.get_or_create(
                id=data["id"],
                defaults={
                    "nombre": data["nombre"],
                },
            )
            
            datos_domicilio_validado[campo] = objeto

    return DomicilioValidado.objects.create(**datos_domicilio_validado)


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
    

@transaction.atomic
def crear_institucion(datos_institucion: dict) -> Institucion:
    domicilio_data = datos_institucion.pop("domicilio")
    
    domicilio_obj = crear_domicilio(domicilio_data)

    return Institucion.objects.create(
        domicilio=domicilio_obj,
        **datos_institucion,
    )
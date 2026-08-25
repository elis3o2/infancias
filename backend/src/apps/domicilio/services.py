import requests
from decouple import config
from django.db import transaction
from .models import (DomicilioValidado, Distrito, Vecinal, Barrio, SeccionalPolicial,Institucion, IdentidadBarrial, Domicilio)
from rest_framework.exceptions import APIException, NotFound

@transaction.atomic
def crear_domicilio_validado(datos: dict) -> DomicilioValidado:

    try:
        informacion_geo = obtener_direccion(
            codigo_calle=datos["codigo_calle"],
            altura=datos["altura"],
            bis=datos["bis"],
            letra=datos.get("letra"),
        )
    except Exception as exc:
        print(f"ERROR API GEO2: {exc}")
        informacion_geo = {}

    relaciones = {
        "distrito": Distrito,
        "vecinal": Vecinal,
        "barrio": Barrio,
        "seccional_policial": SeccionalPolicial,
        "identidad_barrial": IdentidadBarrial,
    }

    for campo, modelo in relaciones.items():
        valor = informacion_geo.get(campo)

        if valor is None:
            continue

        objeto, _ = modelo.objects.get_or_create(
            id=valor["id"],
            defaults={
                "nombre": valor["nombre"],
            },
        )

        informacion_geo[campo] = objeto

    return DomicilioValidado.objects.create(
        codigo_calle=datos["codigo_calle"],
        altura=datos["altura"],
        bis=datos["bis"],
        letra=datos.get("letra"),
        nombreInterseccion=datos.get("nombreInterseccion"),
        codigoInterseccion=datos.get("codigoInterseccion"),
        coordenada_x=datos.get("coordenada_x"),
        coordenada_y=datos.get("coordenada_y"),
        latitud=datos.get("latitud"),
        longitud=datos.get("longitud"),

        distrito=informacion_geo.get("distrito"),
        vecinal=informacion_geo.get("vecinal"),
        barrio=informacion_geo.get("barrio"),
        seccional_policial=informacion_geo.get("seccional_policial"),

        fraccion_censal=informacion_geo.get("fraccion_censal"),
        radio_censal=informacion_geo.get("radio_censal"),
        zona_notificacion=informacion_geo.get("zona_notificacion"),

        identidad_barrial=informacion_geo.get("identidad_barrial"),
        localidad=informacion_geo.get("localidad"),

        puntoX=informacion_geo.get("puntoX"),
        puntoY=informacion_geo.get("puntoY"),
    )

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



def obtener_direccion(
    codigo_calle: int,
    altura: int,
    bis: bool,
    letra: str | None = None,
) -> dict:

    url = (
        f"{config('API_GEO2')}"
        f"?idCalle={codigo_calle}"
        f"&altura={altura}"
        f"&bis={bis}"
        f"{f'&letra={letra}' if letra else ''}"
    )

    try:
        response = requests.get(
            url,
            timeout=10,
            proxies={"http": None, "https": None},
            verify=True,
        )

        if response.status_code == 404:
            return {}

        response.raise_for_status()

        data = response.json()

    except requests.RequestException as exc:
        print(f"ERROR GEO2: {exc}")
        return {}

    resultado = {
        "distrito": None,
        "vecinal": None,
        "barrio": None,
        "seccional_policial": None,
        "fraccion_censal": None,
        "radio_censal": None,
        "zona_notificacion": None,
        "identidad_barrial": None,
        "localidad": data.get("localidad"),
        "puntoX": data.get("puntoX"),
        "puntoY": data.get("puntoY"),
    }

    for division in data.get("divsAdmins", []):
        tipo = division.get("nombreTipo")
        codigo = division.get("codigo")
        nombre = division.get("valor")

        if codigo is None:
            continue

        if tipo == "Distrito":
            resultado["distrito"] = {
                "id": int(codigo),
                "nombre": nombre,
            }

        elif tipo == "Vecinal":
            resultado["vecinal"] = {
                "id": int(codigo),
                "nombre": nombre,
            }

        elif tipo == "Barrio":
            resultado["barrio"] = {
                "id": int(codigo),
                "nombre": nombre,
            }

        elif tipo == "Seccional Policial":
            resultado["seccional_policial"] = {
                "id": int(codigo),
                "nombre": nombre,
            }

        elif tipo == "Fracción Censal":
            resultado["fraccion_censal"] = int(codigo)

        elif tipo == "Radio Censal":
            resultado["radio_censal"] = int(codigo)

        elif tipo == "Identidad Barrial":
            resultado["identidad_barrial"] = {
                "id": int(codigo),
                "nombre": nombre,
            }

    return resultado
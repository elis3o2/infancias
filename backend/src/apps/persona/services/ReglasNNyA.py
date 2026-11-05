
@transaction.atomic
def crear_adolescente(datos_adolescente: dict, solicitud: Solicitud, *,
    referencias_por_temp: dict[str, Institucion] | None = None ) -> Adolescente:
    
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
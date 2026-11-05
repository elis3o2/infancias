
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

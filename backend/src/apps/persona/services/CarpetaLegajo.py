
def _resolver_carpeta(numero: int | None) -> Carpeta:
    if numero is not None:
        carpeta = (
            Carpeta.objects.filter(
                id_insert=numero,
                letra=MARCADOR_RECIBIDO,
            )
            .order_by("id")
            .first()
        )
        if carpeta is not None:
            return carpeta

    return Carpeta.objects.create(
        id_insert=numero,
        letra=MARCADOR_RECIBIDO if numero is not None else MARCADOR_LOCAL,
    )


def _resolver_legajo(numero: int | None, carpeta: Carpeta) -> Legajo:
    if numero is not None:
        legajo = (
            Legajo.objects.filter(
                id_insert=numero,
                letra=MARCADOR_RECIBIDO,
            )
            .order_by("id")
            .first()
        )
        if legajo is not None:
            return legajo

    return Legajo.objects.create(
        carpeta=carpeta,
        id_insert=numero,
        letra=MARCADOR_RECIBIDO if numero is not None else MARCADOR_LOCAL,
    )


def resolver_legajo(legajo_data=None, carpeta_data=None, carpeta_adolescente=None) -> Legajo:
   
    if carpeta_adolescente is not None:
        numero_legajo = legajo_data.get("id_insert") if legajo_data else None
        return _resolver_legajo(numero_legajo, carpeta_adolescente)

    # La pantalla unificada guarda ambos números dentro de ``legajo``.
    if carpeta_data is None and legajo_data:
        carpeta_data = {"id_insert": legajo_data.get("carpeta_id")}

    numero_carpeta = carpeta_data.get("id_insert") if carpeta_data else None
    numero_legajo = legajo_data.get("id_insert") if legajo_data else None

    carpeta = _resolver_carpeta(numero_carpeta)
    return _resolver_legajo(numero_legajo, carpeta)
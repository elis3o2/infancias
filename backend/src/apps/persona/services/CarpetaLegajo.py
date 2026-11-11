"""Numeración manual/automática y carpeta compartida, sin mover legajos existentes."""
from rest_framework.exceptions import ValidationError
from ..models import Carpeta, Legajo, Persona

# Compatibilidad con las columnas históricas; no se exponen letras al operador.
MARCADOR_RECIBIDO = "A"
MARCADOR_LOCAL = "B"


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
    """Resuelve los números de legajo y carpeta sin usar letras de la interfaz."""
    # Los hermanos mantienen la carpeta del adolescente validado. El número
    # de carpeta que pudieran enviar no reemplaza esa asociación familiar.
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


def resolver_legajos_solicitud(personas_datos: list[tuple[Persona, dict | None]]) -> None:
    """Asigna los legajos al final, sin mover legajos entre carpetas existentes."""
    carpetas = {}
    legajos = []
    personas_recibidas = set()
    numeros_recibidos = set()
    for persona, datos in personas_datos:
        if persona.id in personas_recibidas:
            raise ValidationError({"adolescentes": "Una misma persona figura en dos adolescentes."})
        personas_recibidas.add(persona.id)
        datos = datos or {}
        numero = datos.get("id_insert")
        numero_carpeta = datos.get("carpeta_id")
        legajo = persona.legajo

        if numero is not None:
            if numero in numeros_recibidos:
                raise ValidationError({"legajo": "Un mismo legajo no puede asignarse a dos adolescentes."})
            numeros_recibidos.add(numero)

        if datos.get("id") is not None:
            recibido = Legajo.objects.filter(pk=datos["id"]).first()
            if recibido is None:
                raise ValidationError({"legajo": "El legajo indicado no existe."})
            if legajo is not None and legajo.id != recibido.id:
                raise ValidationError({"legajo": "La persona ya tiene otro legajo."})
            legajo = recibido

        if numero is not None:
            if legajo is not None and (
                legajo.id_insert != numero or legajo.letra != MARCADOR_RECIBIDO
            ):
                raise ValidationError({"legajo": "El número informado no coincide con el legajo existente."})
            if legajo is None:
                legajo = Legajo.objects.filter(
                    id_insert=numero, letra=MARCADOR_RECIBIDO,
                ).order_by("id").first()

        if legajo is not None:
            if Persona.objects.filter(legajo=legajo).exclude(pk=persona.id).exists():
                raise ValidationError({"legajo": "El legajo ya pertenece a otra persona."})
            carpetas[legajo.carpeta_id] = legajo.carpeta

        if numero_carpeta is not None:
            carpeta = _resolver_carpeta(numero_carpeta)
            carpetas[carpeta.id] = carpeta

        legajos.append((persona, legajo, numero))

    if len(carpetas) > 1:
        raise ValidationError({
            "legajo": "Los adolescentes tienen carpetas distintas. Debe resolver el conflicto antes de validar."
        })
    if not legajos:
        return

    carpeta = next(iter(carpetas.values())) if carpetas else _resolver_carpeta(None)
    usados = set()
    for persona, legajo, numero in legajos:
        if legajo is None:
            legajo = _resolver_legajo(numero, carpeta)
        if legajo.carpeta_id != carpeta.id or legajo.id in usados:
            raise ValidationError({"legajo": "No se pudo asignar un legajo individual en la carpeta compartida."})
        usados.add(legajo.id)
        if persona.legajo_id != legajo.id:
            persona.legajo = legajo
            persona.save(update_fields=["legajo"])

"""Coherencia del formulario: referencias temporales y relaciones entre adolescentes."""
from collections.abc import Mapping

from rest_framework.exceptions import ValidationError


def _valor_comparable(valor):
    """Convierte datos validados en una forma estable para compararlos."""
    if hasattr(valor, "_meta") and hasattr(valor, "pk"):
        return (valor._meta.label_lower, valor.pk)
    if isinstance(valor, Mapping):
        return tuple(
            sorted((clave, _valor_comparable(dato)) for clave, dato in valor.items())
        )
    if isinstance(valor, (list, tuple)):
        return tuple(_valor_comparable(dato) for dato in valor)
    return valor


def validar_relaciones_formulario(attrs: dict) -> None:
    ids_temp = [adolescente["id_temp"] for adolescente in attrs["adolescentes"]]
    if len(ids_temp) != len(set(ids_temp)):
        raise ValidationError({"adolescentes": "Los id_temp no pueden repetirse."})

    referencias_temporales = {}
    for adolescente in attrs["adolescentes"]:
        for referencia in adolescente.get("referencias_instituciones_data", []):
            id_temp = referencia.get("id_temp")
            if id_temp is None:
                continue
            definicion = _valor_comparable({
                campo: valor
                for campo, valor in referencia.items()
                if campo != "id_temp"
            })
            anterior = referencias_temporales.setdefault(id_temp, definicion)
            if anterior != definicion:
                raise ValidationError({
                    "adolescentes": (
                        "Una referencia con el mismo id_temp debe tener "
                        "los mismos datos."
                    )
                })

    relaciones = set()
    for relacion in attrs.get("relaciones_adolescentes", []):
        primero, segundo = relacion["id_temp1"], relacion["id_temp2"]
        if primero not in ids_temp or segundo not in ids_temp:
            raise ValidationError({
                "relaciones_adolescentes": "Los id_temp deben pertenecer a esta solicitud."
            })
        if primero == segundo:
            raise ValidationError({
                "relaciones_adolescentes": "Un adolescente no puede relacionarse consigo mismo."
            })
        clave = (primero, segundo, relacion["vinculo"].pk)
        if clave in relaciones:
            raise ValidationError({"relaciones_adolescentes": "Hay relaciones repetidas."})
        relaciones.add(clave)

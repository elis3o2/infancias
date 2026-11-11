"""Resolución de instituciones compartidas por identificador temporal."""
from rest_framework.exceptions import ValidationError
from src.apps.domicilio.models import Institucion
from src.apps.domicilio.services import crear_institucion


def _resolver_referencia_institucion(
    referencia_data: dict,
    referencias_por_temp: dict[str, Institucion] | None,
) -> Institucion:
    """Resuelve una referencia existente o crea una sola por ``id_temp``.

    El caché dura únicamente durante la creación de una solicitud. Así dos
    adolescentes pueden apuntar a la misma institución nueva sin convertir la
    referencia en un dato de ``Solicitud``.
    """
    referencia_data = referencia_data.copy()
    id_temp = referencia_data.pop("id_temp", None)
    referencia = referencia_data.pop("id", None)

    if id_temp and referencias_por_temp is not None and id_temp in referencias_por_temp:
        existente = referencias_por_temp[id_temp]
        if referencia is not None and referencia.pk != existente.pk:
            raise ValidationError({
                "referencias_instituciones_data": (
                    "Un id_temp de referencia no puede identificar instituciones distintas."
                )
            })
        return existente

    if referencia is None:
        referencia = crear_institucion(referencia_data)
    elif not isinstance(referencia, Institucion):
        raise ValidationError({"referencias_instituciones_data": "La institución es inválida."})

    if id_temp and referencias_por_temp is not None:
        referencias_por_temp[id_temp] = referencia

    return referencia

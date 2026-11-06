"""Adapta el contrato de API_RNP a la identidad utilizada por Infancias."""

from datetime import date
from typing import cast

from .identidad_types import (
    DatosPersonaRNP, IdentidadRespuestaParcial, IdentidadRevisionRequerida,
    ResultadoIdentidad,
)
from .types import Ciudadano, DatosDigitalizacion, ServicioExternoError


def normalizar_identidad(resultado: ResultadoIdentidad, dni: str, sexo: str) -> DatosDigitalizacion:
    bloque = resultado.datos.get("persona")
    if not isinstance(bloque, dict):
        raise ServicioExternoError("API_RNP no devolvió el bloque de persona.")
    datos = bloque.get("datos")
    if isinstance(datos, dict) and datos.get("requiere_revision") is True:
        raise IdentidadRevisionRequerida()
    if bloque.get("estado") != "ok":
        if resultado.parcial:
            raise IdentidadRespuestaParcial()
        raise ServicioExternoError("API_RNP no pudo verificar los datos de la persona.")
    if not isinstance(datos, dict) or datos.get("requiere_revision") is not False:
        raise ServicioExternoError("API_RNP no informó si la identidad requiere revisión.")

    for campo in ("dni", "sexo", "apellido", "nombres", "fecha_nacimiento"):
        valor = datos.get(campo)
        if not isinstance(valor, str) or not valor.strip():
            raise ServicioExternoError("API_RNP no informó todos los datos de identidad requeridos.")

    persona = cast(DatosPersonaRNP, datos)
    documento = persona["dni"].strip()
    if not documento.isascii() or not documento.isdigit():
        raise ServicioExternoError("API_RNP devolvió un documento inválido.")
    if int(documento) != int(dni) or persona["sexo"] != sexo:
        raise ServicioExternoError("API_RNP devolvió datos que no coinciden con la consulta.")
    try:
        nacimiento = date.fromisoformat(persona["fecha_nacimiento"])
        if nacimiento.isoformat() != persona["fecha_nacimiento"]:
            raise ValueError("Formato de fecha no válido")
    except ValueError as exc:
        raise ServicioExternoError("API_RNP devolvió una fecha de nacimiento inválida.") from exc

    ciudadano = Ciudadano(
        nombre=persona["nombres"].strip(), apellido=persona["apellido"].strip(),
        nroDocumento=int(documento), sexo=persona["sexo"],
        fechaNacimiento=nacimiento.isoformat(),
    )
    # RNP no proporciona la HC usada por esta aplicación. No inferirla de SISROS,
    # ni conservar una HC de una respuesta incompleta de Digitalización.
    return {**ciudadano.como_dict(), "hc": None}

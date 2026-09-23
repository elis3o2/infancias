"""Contratos tipados para los proveedores HTTP externos.

Las respuestas remotas se reciben como JSON no confiable. Los tipos de este
módulo describen los contratos que exponemos al resto de la aplicación, sin
propagar valores de tipo impreciso fuera del borde de integración.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Protocol, TypeAlias, TypedDict


JsonScalar: TypeAlias = str | int | float | bool | None
JsonValue: TypeAlias = JsonScalar | list["JsonValue"] | dict[str, "JsonValue"]
JsonObject: TypeAlias = dict[str, JsonValue]
JsonArray: TypeAlias = list[JsonValue]
ParametrosConsulta: TypeAlias = dict[str, str | int | float | bool | None]
CabecerasHTTP: TypeAlias = dict[str, str]
CoordenadaEntrada: TypeAlias = str | int | float


class RespuestaDigitalizacion(TypedDict, total=False):
    ciudadano: JsonObject
    sisa_data: JsonObject
    results_query1: JsonArray
    results_query2: JsonArray


class DatosDigitalizacion(TypedDict):
    nombre: str | None
    apellido: str | None
    sexo: str | None
    fechaNacimiento: JsonValue
    nroDocumento: JsonValue
    fecha_nacimiento: JsonValue
    hcf: JsonValue
    adscripcion: list[JsonValue]
    fallecido: JsonValue


class AntecedentesHistoriaClinica(TypedDict):
    adscripcion: list[JsonValue]
    efectores: list[JsonValue]
    obra_social: list[JsonValue]


class DatosCiudadano(TypedDict):
    nombre: str
    apellido: str
    nroDocumento: int
    sexo: str
    fechaNacimiento: str


@dataclass(frozen=True, slots=True)
class Ciudadano:
    """Datos obligatorios y validados que devuelve API_CIUDADANO."""

    nombre: str
    apellido: str
    nroDocumento: int
    sexo: str
    fechaNacimiento: str

    def como_dict(self) -> DatosCiudadano:
        """Adapta el objeto para respuestas JSON de la API interna."""
        return {
            "nombre": self.nombre,
            "apellido": self.apellido,
            "nroDocumento": self.nroDocumento,
            "sexo": self.sexo,
            "fechaNacimiento": self.fechaNacimiento,
        }


class FeatureGeografico(TypedDict):
    altura: JsonValue
    bis: JsonValue
    codigoCalle: JsonValue
    codigoInterseccion: JsonValue
    id: str
    letra: JsonValue
    name: JsonValue
    nombreCalle: JsonValue
    nombreInterseccion: JsonValue
    coordenada_x: CoordenadaEntrada
    coordenada_y: CoordenadaEntrada
    longitud: float
    latitud: float


class DivisionAdministrativa(TypedDict):
    id: int
    nombre: JsonValue


class DireccionGeografica(TypedDict):
    distrito: DivisionAdministrativa | None
    vecinal: DivisionAdministrativa | None
    barrio: DivisionAdministrativa | None
    seccional_policial: DivisionAdministrativa | None
    fraccion_sensal: int | None
    radio_sensal: int | None
    zona_notificacion: int | None
    identidad_barrial: DivisionAdministrativa | None
    localidad: JsonValue
    puntoX: JsonValue
    puntoY: JsonValue


class ArchivoAdjunto(Protocol):
    """Parte mínima de un archivo que requiere API_EMAIL."""

    name: str
    content_type: str

    def read(self) -> bytes: ...


ArchivosAdjuntos: TypeAlias = Iterable[ArchivoAdjunto]
DestinatariosCorreo: TypeAlias = Iterable[str]
RespuestaCorreo: TypeAlias = JsonObject

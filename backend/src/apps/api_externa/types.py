"""Contratos tipados para los proveedores HTTP externos.

Las respuestas remotas se reciben como JSON no confiable. Los tipos de este
módulo describen los contratos que exponemos al resto de la aplicación, sin
propagar valores de tipo impreciso fuera del borde de integración.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from typing import NotRequired, Protocol, TypeAlias, TypedDict



class ServicioExternoError(RuntimeError):
    """La integración remota no pudo completar la operación."""


class ServicioExternoNoConfigurado(ServicioExternoError):
    """Falta la URL o credencial necesaria para una integración."""


class RecursoExternoNoEncontrado(ServicioExternoError):
    """El proveedor respondió que el recurso consultado no existe."""



JsonScalar: TypeAlias = str | int | float | bool | None
JsonValue: TypeAlias = JsonScalar | list["JsonValue"] | dict[str, "JsonValue"]
JsonObject: TypeAlias = dict[str, JsonValue]
JsonArray: TypeAlias = list[JsonValue]
ParametrosConsulta: TypeAlias = dict[str, str | int | float | bool | None]
CabecerasHTTP: TypeAlias = dict[str, str]
CoordenadaEntrada: TypeAlias = str | int | float


class DatosCiudadano(TypedDict):
    nombre: str
    apellido: str
    nroDocumento: int
    sexo: str
    fechaNacimiento: str


class DatosDigitalizacion(DatosCiudadano):
    hc: str | None
    hcf: NotRequired[str | None]


class RespuestaCiudadano(TypedDict):
    ciudadano: DatosCiudadano


class HistoriaDigitalizacion(TypedDict):
    """Campo consumido del primer elemento de results_query1."""

    hc: str | None


class RespuestaDigitalizacion(TypedDict):
    """Secciones consumidas de API_DIGITALIZACION, sin nombres alternativos."""

    sisa_data: RespuestaCiudadano
    results_query1: list[HistoriaDigitalizacion]



class HCFResultado(TypedDict):
    idPersona: int
    DNI: str
    numeroHCI: int
    numeroHCF: int
    apellido: str
    nombre: str
    sexo: str
    fechaNacimiento: str

    codigoCalle: int
    nombreCalle: str
    numCalle: str

    coordXPacienteUltimaAtencion: float | None
    coordYPacienteUltimaAtencion: float | None

    fecha_insert: str
    fechaFallecido: str | None
    fallecido: int

    validated_at: str

    latitud_wgs84: float | None
    longitud_wgs84: float | None

    flag_discapacidades: int
    flag_consumos_problematicos: int
    flag_intentos_de_suicidio: int
    flag_problemas_socioambientales: int
    flag_violencias: int


class HCFResponse(TypedDict):
    hcf: int
    resultados: list[HCFResultado]



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

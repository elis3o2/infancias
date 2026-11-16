"""Contratos tipados para los proveedores HTTP externos.

Las respuestas remotas se reciben como JSON no confiable. Los tipos de este
módulo describen los contratos que exponemos al resto de la aplicación, sin
propagar valores de tipo impreciso fuera del borde de integración.
"""

from __future__ import annotations

import time
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, NotRequired, Protocol, TypeAlias, TypedDict



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



SexoIdentidad = Literal["F", "M", "X"]
SeccionIdentidad = Literal["renaper", "puco", "sisros"]


class ConsultaIdentidad(TypedDict):
    dni: str
    sexo: SexoIdentidad
    secciones: NotRequired[list[SeccionIdentidad]]


class DatosPersonaRNP(TypedDict):
    """Campos de persona.datos que consume Infancias, sin nombres alternativos."""

    dni: str
    sexo: SexoIdentidad
    apellido: str
    nombres: str
    fecha_nacimiento: str
    requiere_revision: bool


class DatosSisrosRNP(TypedDict):
    """Números de historia clínica de sisros.datos, sin nombres alternativos."""

    numero_hci: int | None
    numero_hcf: int | None


@dataclass(frozen=True, slots=True)
class ResultadoIdentidad:
    codigo_http: Literal[200, 207]
    # Se conserva el JSON original, incluidos los estados de cada bloque.
    # Se valida el bloque persona antes de adaptarlo al contrato interno.
    datos: JsonObject

    @property
    def parcial(self) -> bool:
        return self.codigo_http == 207


class IdentidadHTTPError(ServicioExternoError):
    def __init__(self, codigo_http: int, mensaje: str) -> None:
        super().__init__(mensaje)
        self.codigo_http = codigo_http


class IdentidadRevisionRequerida(IdentidadHTTPError):
    def __init__(self) -> None:
        super().__init__(409, "La coincidencia requiere revisión humana; no se puede validar automáticamente.")


class IdentidadRespuestaParcial(ServicioExternoError):
    def __init__(self) -> None:
        super().__init__("Identidad devolvió datos parciales. No se pudo completar la verificación.")


class IdentidadLimiteExcedido(ServicioExternoError):
    def __init__(self, reintentar_en: int, *, remoto: bool = False) -> None:
        super().__init__("Se alcanzó el límite de consultas de Identidad.")
        self.reintentar_en = reintentar_en
        self.remoto = remoto


@dataclass(frozen=True, slots=True)
class ConfiguracionIdentidad:
    url: str
    clave: str
    certificado: Path
    metodo: Literal["GET", "POST"]
    usar_proxy: bool
    archivo_limites: Path


@dataclass
class EstadoLimites:
    consultas: list[float]
    bloqueado_hasta: float = 0

    def pausar(self, segundos: int) -> None:
        self.bloqueado_hasta = max(self.bloqueado_hasta, time.time() + segundos)


class ConsultaPersonaExternaDatos(TypedDict):
    dni: str
    sexo: str


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

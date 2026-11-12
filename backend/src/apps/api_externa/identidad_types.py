"""Contrato de consulta y resultados de la nueva API de Identidad."""

from dataclasses import dataclass
from typing import Literal, NotRequired, TypedDict

from .types import JsonObject, ServicioExternoError

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

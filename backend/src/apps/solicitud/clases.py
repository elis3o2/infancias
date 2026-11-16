"""Contratos entre los casos de uso de solicitud y sus adaptadores."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from django.db.models import QuerySet
    from .models import Solicitud


@dataclass(frozen=True)
class SeccionFormulario:
    titulo: str
    campos: tuple[tuple[str, str], ...]


@dataclass(frozen=True)
class CopiaFormulario:
    numero: int
    fecha: str
    secciones: tuple[SeccionFormulario, ...]


@dataclass(frozen=True)
class ResultadoReporte:
    general: dict[str, object]
    desde: date | None
    hasta: date | None
    resumen: dict[str, object]
    solicitudes: QuerySet[Solicitud]

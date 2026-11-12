"""Cuota persistente compartida por los workers del mismo servidor Linux.

Solo almacena tiempos, nunca claves, documentos ni respuestas. El bloqueo se
mantiene durante la consulta: no hay solicitudes simultáneas ni colas durmientes.
"""

import fcntl
import json
import math
import os
import tempfile
import time
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path

from .identidad_types import IdentidadLimiteExcedido
from .types import ServicioExternoError


CONSULTAS_POR_MINUTO = 2
CONSULTAS_POR_DIA = 48
INTERVALO_CONSULTAS = 3
# Conservar estados anteriores al cambio de cuota, sin reiniciar su consumo.
MAX_REGISTROS_HISTORICOS = 10000


@dataclass
class EstadoLimites:
    consultas: list[float]
    bloqueado_hasta: float = 0

    def pausar(self, segundos: int) -> None:
        self.bloqueado_hasta = max(self.bloqueado_hasta, time.time() + segundos)


def _leer(archivo: Path) -> EstadoLimites:
    if not archivo.exists():
        return EstadoLimites([])
    datos: object = json.loads(archivo.read_text(encoding="utf-8"))
    if not isinstance(datos, dict):
        raise ValueError("Estado inválido")
    consultas = datos.get("consultas")
    bloqueo = datos.get("bloqueado_hasta")
    if not isinstance(consultas, list) or len(consultas) > MAX_REGISTROS_HISTORICOS:
        raise ValueError("Estado inválido")
    for valor in [*consultas, bloqueo]:
        if type(valor) not in (float, int) or not math.isfinite(valor) or valor < 0:
            raise ValueError("Estado inválido")
    if consultas != sorted(consultas):
        raise ValueError("Estado inválido")
    return EstadoLimites([float(valor) for valor in consultas], float(bloqueo))


def _guardar(archivo: Path, estado: EstadoLimites) -> None:
    temporal: str | None = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=archivo.parent, delete=False) as salida:
            temporal = salida.name
            json.dump({"consultas": estado.consultas, "bloqueado_hasta": estado.bloqueado_hasta}, salida)
            salida.flush()
            os.fsync(salida.fileno())
        os.replace(temporal, archivo)
    finally:
        if temporal is not None and os.path.exists(temporal):
            os.unlink(temporal)


def _reservar(estado: EstadoLimites, ahora: float) -> None:
    # Ventana móvil de 24 horas: conservadora frente a un cupo por día calendario.
    estado.consultas = [fecha for fecha in estado.consultas if fecha > ahora - 86400]
    disponible = estado.bloqueado_hasta
    if estado.consultas:
        disponible = max(disponible, estado.consultas[-1] + INTERVALO_CONSULTAS)
    minuto = [fecha for fecha in estado.consultas if fecha > ahora - 60]
    if len(minuto) >= CONSULTAS_POR_MINUTO:
        disponible = max(disponible, minuto[-CONSULTAS_POR_MINUTO] + 60)
    if len(estado.consultas) >= CONSULTAS_POR_DIA:
        # Si el estado anterior supera la nueva cuota, esperar hasta que queden 47.
        disponible = max(disponible, estado.consultas[-CONSULTAS_POR_DIA] + 86400)
    if disponible > ahora:
        raise IdentidadLimiteExcedido(math.ceil(disponible - ahora))
    estado.consultas.append(ahora)
    estado.bloqueado_hasta = ahora + INTERVALO_CONSULTAS


@contextmanager
def limitar_consulta(archivo: Path) -> Iterator[EstadoLimites]:
    try:
        archivo.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        descriptor = os.open(str(archivo) + ".lock", os.O_CREAT | os.O_RDWR, 0o600)
        with os.fdopen(descriptor, "a") as bloqueo:
            try:
                fcntl.flock(bloqueo, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                raise IdentidadLimiteExcedido(INTERVALO_CONSULTAS) from None
            try:
                estado = _leer(archivo)
                _reservar(estado, time.time())
                _guardar(archivo, estado)  # Contar incluso timeout o caída del worker.
                try:
                    yield estado
                finally:
                    # También separar tres segundos después de una consulta lenta.
                    estado.consultas[-1] = max(estado.consultas[-1], time.time())
                    estado.pausar(INTERVALO_CONSULTAS)
                    _guardar(archivo, estado)
            finally:
                fcntl.flock(bloqueo, fcntl.LOCK_UN)
    except (OSError, ValueError) as exc:
        # Nunca continuar sin cuota si el archivo está dañado o no es escribible.
        raise ServicioExternoError("No se pudo verificar el límite compartido de Identidad.") from exc

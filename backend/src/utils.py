"""Compatibilidades generales del proyecto.

Las integraciones HTTP viven en ``apps.api_externa``. El reexport evita romper
algún consumidor heredado que aún importe esta función desde ``src.utils``.
"""

from src.apps.api_externa.services import enviar_correo


__all__ = ["enviar_correo"]

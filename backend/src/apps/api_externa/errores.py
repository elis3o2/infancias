"""Errores de proveedores: no confundir una falla con una persona inexistente."""

import logging

from rest_framework.response import Response

from .identidad_types import (
    IdentidadHTTPError, IdentidadLimiteExcedido, IdentidadRespuestaParcial,
    IdentidadRevisionRequerida,
)
from .types import ServicioExternoError, ServicioExternoNoConfigurado

logger = logging.getLogger(__name__)


def respuesta_error_servicio(exc: ServicioExternoError) -> Response:
    if isinstance(exc, IdentidadRevisionRequerida):
        return Response({"detail": str(exc)}, status=409)
    if isinstance(exc, IdentidadLimiteExcedido):
        return Response(
            {"detail": f"Identidad alcanzó el límite de consultas. Intentá nuevamente en {exc.reintentar_en} segundos."},
            status=429, headers={"Retry-After": str(exc.reintentar_en)},
        )
    if isinstance(exc, IdentidadRespuestaParcial):
        return Response({"detail": str(exc)}, status=503)
    if isinstance(exc, ServicioExternoNoConfigurado):
        return Response({"detail": "El servicio externo no está configurado."}, status=503)
    logger.warning("Falló una consulta a servicio externo: %s", exc)
    if isinstance(exc, IdentidadHTTPError) and exc.codigo_http == 404:
        return Response(
            {"detail": (
                "Identidad (API_RNP) respondió HTTP 404. Revisá la URL y el método "
                "configurados (API_RNP e IDENTIDAD_HTTP_METHOD). "
                "Esta respuesta no confirma que la persona no exista."
            )},
            status=502,
        )
    # Un 401/403 del proveedor no significa que la sesión del usuario haya vencido.
    return Response({"detail": "No fue posible consultar el servicio externo."}, status=502)

from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action

from src.permissions import IsOperationalUser
from .errores import respuesta_error_servicio as _respuesta_error_servicio
from .serializers import (
    ConsultaPersonaExternaSerializer,
    GeoCoordenadasQuerySerializer,
    GeoDireccionQuerySerializer,
    GeoFeaturesQuerySerializer,
)

from .services import (
    buscar_features_geo,
    consultar_ciudadano,
    obtener_direccion_geo,
    obtener_latitud_longitud_geo,
)
from .types import (
    RecursoExternoNoEncontrado,
    ServicioExternoError,
)


class CiudadanoAPIView(APIView):
    """Consulta individual del servicio de ciudadano."""

    permission_classes = [IsOperationalUser]

    def get(self, request: Request, *args: object, **kwargs: object) -> Response:
        serializer = ConsultaPersonaExternaSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        ciudadano = consultar_ciudadano(**serializer.validated_data)
        if ciudadano is None:
            return Response(
                {"detail": "No se encontraron datos para la persona."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(ciudadano.como_dict(), status=status.HTTP_200_OK)


class GeoDataViewSet(ViewSet):
    """Fachada de sólo lectura para los tres servicios geográficos externos."""


    @action(detail=False, methods=["get"], url_path="features")
    def features(self, request: Request, *args: object, **kwargs: object) -> Response:
        serializer = GeoFeaturesQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        try:
            return Response(buscar_features_geo(**serializer.validated_data))
        except RecursoExternoNoEncontrado as exc:
            raise NotFound() from exc
        except ServicioExternoError as exc:
            return _respuesta_error_servicio(exc)

    @action(detail=False, methods=["get"], url_path="direccion")
    def direccion(self, request: Request, *args: object, **kwargs: object) -> Response:
        serializer = GeoDireccionQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        try:
            return Response(
                obtener_direccion_geo(
                    codigo_calle=serializer.validated_data["codigoCalle"],
                    altura=serializer.validated_data["altura"],
                    bis=serializer.validated_data["bis"],
                    letra=serializer.validated_data.get("letra") or None,
                )
            )
        except RecursoExternoNoEncontrado as exc:
            raise NotFound() from exc
        except ServicioExternoError as exc:
            return _respuesta_error_servicio(exc)

    @action(detail=False, methods=["get"], url_path="latitud-longitud")
    def latitud_longitud(
        self,
        request: Request,
        *args: object,
        **kwargs: object,
    ) -> Response:
        serializer = GeoCoordenadasQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        try:
            return Response(obtener_latitud_longitud_geo(**serializer.validated_data))
        except RecursoExternoNoEncontrado as exc:
            raise NotFound() from exc
        except ServicioExternoError as exc:
            return _respuesta_error_servicio(exc)

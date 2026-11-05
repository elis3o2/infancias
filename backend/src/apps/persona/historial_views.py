from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from src.permissions import IsOperationalUser
from .historial import buscar_ninos, datos_nino, ninos_historial, registros_identificados, solicitudes_del_nino
from .historial_serializers import (
    BusquedaHistorialSerializer, NinoHistorialSerializer, SolicitudHistorialSerializer,
)


class HistorialPagination(PageNumberPagination):
    page_size = 20


class HistorialNinoViewSet(viewsets.GenericViewSet):
    lookup_value_regex = "[0-9]+"
    permission_classes = [IsOperationalUser]
    pagination_class = HistorialPagination
    serializer_class = NinoHistorialSerializer
    http_method_names = ["get", "head", "options"]

    def list(self, request):
        filtros = BusquedaHistorialSerializer(data=request.query_params)
        filtros.is_valid(raise_exception=True)
        pagina = self.paginate_queryset(buscar_ninos(filtros.validated_data))
        return self.get_paginated_response(self.get_serializer([
            datos_nino(adolescente) for adolescente in pagina
        ], many=True).data)

    def retrieve(self, request, pk=None):
        # Acepta enlaces previos aunque una solicitud posterior cambie el
        # registro representativo del mismo niño en los resultados de búsqueda.
        original = get_object_or_404(registros_identificados(), pk=pk)
        adolescente = get_object_or_404(ninos_historial(),
            dni_identidad=original.dni_identidad, sexo_identidad=original.sexo_identidad)
        return Response({
            "nino": self.get_serializer(datos_nino(adolescente)).data,
            "solicitudes": SolicitudHistorialSerializer(solicitudes_del_nino(adolescente), many=True).data,
        })

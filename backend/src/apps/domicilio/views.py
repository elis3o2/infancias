import requests
from decouple import config
from rest_framework import status, viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.viewsets import ViewSet
from rest_framework.exceptions import NotFound, APIException
from .models import Institucion, TipoInstitucion, Provincia, Departamento, Domicilio
from .serializers import (ProvinciaSerializer, DepartamentoSerializer, InstitucionSerializer, TipoInstitucionSerializer,
                        DomicilioSerializer)
from src.permissions import IsOperationalUser, ReadOnly

class ProvinciaViewSet(viewsets.ModelViewSet):
    queryset = Provincia.objects.all()
    serializer_class = ProvinciaSerializer
    permission_classes = [ReadOnly]


class DepartamentoViewSet(viewsets.ModelViewSet):
    serializer_class = DepartamentoSerializer
    permission_classes = [ReadOnly]

    def get_queryset(self):
        queryset = Departamento.objects.select_related("provincia")

        id_provincia = self.request.query_params.get("id_provincia")

        if id_provincia:
            queryset = queryset.filter(provincia__id=id_provincia)

        return queryset

class TipoInstitucionViewSet(viewsets.ModelViewSet):
    queryset = TipoInstitucion.objects.all()
    serializer_class = TipoInstitucionSerializer
    permission_classes = [ReadOnly]


class InstitucionViewSet(viewsets.ModelViewSet):
    queryset = Institucion.objects.all()
    serializer_class = InstitucionSerializer
    permission_classes = [ReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()

        # Solo instituciones con domicilio validado
        qs = qs.filter(domicilio__domicilio_validado__isnull=False)

        id_tipo = self.request.query_params.get("id_tipo")

        if id_tipo:
            qs = qs.filter(tipo_id=id_tipo)

        return qs

    @action(detail=False, methods=["get"], url_path="educacion")
    def educacion(self, request):
        qs = self.get_queryset().filter(tipo__nombre__iexact="Educativa")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="territorial")
    def territorial(self, request):
        # La categoría es un registro de catálogo, no un campo booleano del
        # modelo. Si el catálogo no tiene este tipo, la respuesta es una lista
        # vacía en lugar de un FieldError.
        qs = self.get_queryset().filter(tipo__nombre__iexact="Territorial")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class DomicilioViewSet(viewsets.ModelViewSet):
    queryset = Domicilio.objects.all()
    serializer_class = DomicilioSerializer
    permission_classes = [IsOperationalUser, ReadOnly]

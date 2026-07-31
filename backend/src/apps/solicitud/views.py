import json
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from .models import PrioridadSolicitud, MotivoSolicitud, Solicitud, Archivo
from .serializers import PrioridadSolicitudSerializer, MotivoSolicitudSerializer, SolicitudSerializer, ArchivoSerializer
from src.permissions import ReadOnly


class PrioridadSolicitudViewSet(viewsets.ModelViewSet):
    queryset = PrioridadSolicitud.objects.all()
    serializer_class = PrioridadSolicitudSerializer
    permission_classes = [ReadOnly]

class MotivoSolicitudViewSet(viewsets.ModelViewSet):
    queryset = MotivoSolicitud.objects.all()
    serializer_class = MotivoSolicitudSerializer
    permission_classes = [ReadOnly]

class SolicitudViewSet(viewsets.ModelViewSet):
    queryset = Solicitud.objects.all()
    serializer_class = SolicitudSerializer
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        for campo in ("adolescente", "solicitante", "institucion"):
            if campo in data:
                data[campo] = json.loads(data[campo])
        serializer = self.get_serializer(data=data)
        #serializer.is_valid(raise_exception=True)

        if not serializer.is_valid():
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        solicitud = serializer.save()

        for file in request.FILES.getlist("archivos"):
            Archivo.objects.create(
                solicitud=solicitud,
                nombre=file.name,
                tipo_mime=file.content_type,
                contenido=file.read(),
            )

        return Response(
            self.get_serializer(solicitud).data,
            status=status.HTTP_201_CREATED,
        )

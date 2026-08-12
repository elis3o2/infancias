import json
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import HttpResponse
from django.db import transaction
from django.utils import timezone
from django.db.models.functions import Coalesce
from .models import PrioridadSolicitud, MotivoSolicitud, Solicitud, Archivo, Derivacion
from .serializers import PrioridadSolicitudSerializer, MotivoSolicitudSerializer, SolicitudSerializer, ArchivoSerializer, DerivacionSerializer, SolicitudListSerializer
from src.permissions import ReadOnly
from src.utils import enviar_correo

class PrioridadSolicitudViewSet(viewsets.ModelViewSet):
    queryset = PrioridadSolicitud.objects.all()
    serializer_class = PrioridadSolicitudSerializer
    permission_classes = [ReadOnly]

class MotivoSolicitudViewSet(viewsets.ModelViewSet):
    queryset = MotivoSolicitud.objects.all()
    serializer_class = MotivoSolicitudSerializer
    permission_classes = [ReadOnly]

class SolicitudViewSet(viewsets.ModelViewSet):
    queryset = Solicitud.objects.annotate(
        fecha_orden=Coalesce(
            "fecha_hora_modificacion",
            "fecha_hora_creacion",
        )
    ).order_by("-fecha_orden")
    serializer_class = SolicitudSerializer

    def get_serializer_class(self):
        if self.action in ["list", "validados", "sin_validar", "rechazados"]:
            return SolicitudListSerializer

        return SolicitudSerializer

    @action(detail=False, methods=["get"])
    def validados(self, request):
        id_derivacion = request.query_params.get("id_derivacion")

        if not id_derivacion:
            return Response(
                {"error": "id_derivacion es requerido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = self.get_queryset().filter(
            derivacion_id=id_derivacion,
            rechazado=True,
            validado=False,
        )

        serializer = self.get_serializer(qs, many=True)

        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def sin_validar(self, request):
        qs = self.get_queryset()

        qs = qs.filter(validado=False, rechazado=False)

        serializer = self.get_serializer(qs, many=True)

        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def rechazados(self, request):
        qs = self.get_queryset()

        qs = qs.filter(rechazado=True)

        serializer = self.get_serializer(qs, many=True)

        return Response(serializer.data)


    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = {}

        for key in request.data.keys():
            if key == "archivos":
                continue
            data[key] = request.data.get(key)

        for campo in ("adolescente", "solicitante", "institucion"):
            if campo in data:
                data[campo] = json.loads(data[campo])

        serializer = self.get_serializer(data=data)

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
        
        # enviar_correo(subject="FORMULARIO PROBLEMÁTICA", body="La solicitud fue enviada correctamente.", to_emails=[solicitud.correo])
        return Response(
            self.get_serializer(solicitud).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["put"])
    def validar(self, request, pk=None):
        id_derivacion = self.request.query_params.get("id_derivacion")
        solicitud = self.get_object()
        solicitud.validado = True
        solicitud.rechazado = False
        solicitud.derivacion_id = id_derivacion
        solicitud.fecha_hora_modificacion = timezone.now()
        enviar_correo(subject="FORMULARIO PROBLEMÁTICA", body="Su solicitud fue aprobada.", to_emails=[solicitud.solicitante.correo])
        solicitud.save()
        return Response(self.get_serializer(solicitud).data)

    @action(detail=True, methods=["put"])
    def rechazar(self, request, pk=None):
        motivo = self.request.query_params.get("motivo")
        solicitud = self.get_object()
        solicitud.validado = False
        solicitud.rechazado = True
        solicitud.motivo_rechazo = motivo
        solicitud.fecha_hora_modificacion = timezone.now()
        enviar_correo(subject="FORMULARIO PROBLEMÁTICA", body=f"Su solicitud fue rechazada. A continuación se detallan los motivos.\n\n{motivo}",
                    to_emails=[solicitud.solicitante.correo])
        solicitud.save()
        return Response(self.get_serializer(solicitud).data)



class ArchivoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Archivo.objects.all()
    serializer_class = ArchivoSerializer

    @action(detail=True, methods=["get"])
    def descargar(self, request, pk=None):
        archivo = self.get_object()

        response = HttpResponse(
            archivo.contenido,
            content_type=archivo.tipo_mime or "application/octet-stream"
        )

        response["Content-Disposition"] = (
            f'attachment; filename="{archivo.nombre}"'
        )

        return response

class DerivacionViewSet(viewsets.ModelViewSet):
    queryset = Derivacion.objects.all()
    serializer_class = DerivacionSerializer
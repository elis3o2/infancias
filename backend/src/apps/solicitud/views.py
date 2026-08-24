import json
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import HttpResponse
from django.db import transaction
from django.utils import timezone
from django.db.models.functions import Coalesce
from .models import PrioridadSolicitud, MotivoSolicitud, Solicitud, Archivo
from .serializers import (PrioridadSolicitudSerializer, MotivoSolicitudSerializer, ArchivoSerializer, 
                        SolicitudListSerializer, SolicitudCreateSerializer, SolicitudReadSerializer, SolicitudValReadSerializer, SolicitudWriteSerializer)
from .permissions import SolicitudPermission
from .services import crear_solicitud
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

    permission_classes = [SolicitudPermission]

    queryset = Solicitud.objects.annotate(
        fecha_orden=Coalesce(
            "fecha_hora_entrada",
            "fecha_hora_creacion",
        )
    ).order_by("-fecha_orden")

    serializer_class = SolicitudReadSerializer

    def get_serializer_class(self):
        if self.action in [
            "list",
            "validados",
            "sin_validar",
            "rechazados",
        ]:
            return SolicitudListSerializer

        return SolicitudReadSerializer


    def retrieve(self, request, *args, **kwargs):
        solicitud = self.get_object()

        if solicitud.validado:
            serializer = SolicitudValReadSerializer(
                solicitud,
                context={"request": request}
            )
        else:
            serializer = SolicitudReadSerializer(
                solicitud,
                context={"request": request}
            )

        return Response(serializer.data)

    # QUERYSET SEGUN GRUPO
    def get_queryset(self):
        qs = super().get_queryset()
        desde = self.request.query_params.get("desde")
        hasta = self.request.query_params.get("hasta")

        if desde:
            qs = qs.filter(fecha_orden__date__gte=desde)

        if hasta:
            qs = qs.filter(fecha_orden__date__lte=hasta)

        if not self.request.user.is_authenticated:
            return qs.none()

        user = self.request.user

        # ENTRADA:
        # puede ver todas las solicitudes.
        if user.groups.filter(name="entrada").exists():
            return qs

        # GUARDIA:
        # solamente solicitudes validadas y derivadas a guardia.
        if user.groups.filter(name="guardia").exists():
            return qs.filter(
                validado=True,
                rechazado=False,
            )

        # ADMISION:
        # solamente solicitudes validadas y derivadas a admision.
        if user.groups.filter(name="admision").exists():
            return qs.filter(
                validado=True,
                rechazado=False,
            )

        # Usuario autenticado pero sin grupo
        return qs.none()

    # CREAR
    def create(self, request, *args, **kwargs):
        data = {}
        for key, value in request.data.items():
            if key == "archivos":
                continue
            data[key] = value

        for campo in ("adolescente", "institucion"):
            if campo in data and isinstance(data[campo], str):
                try:
                    data[campo] = json.loads(data[campo])
                except json.JSONDecodeError:
                    return Response(
                        {campo: "El formato JSON es inválido."}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

        serializer = SolicitudCreateSerializer(data=data)

        if not serializer.is_valid():
            print(serializer.errors)
            raise serializers.ValidationError(serializer.errors)
        
        archivos = request.FILES.getlist("archivos")
        
        try:
            solicitud = crear_solicitud(
                datos_solicitud=serializer.validated_data,
                archivos=archivos,
            )
        except Exception as exc:
            import traceback

            print("ERROR:", repr(exc))
            traceback.print_exc()
            raise

        return Response(
            SolicitudCreateSerializer(solicitud).data,
            status=status.HTTP_201_CREATED,
        )


    # SIN VALIDAR
    @action(detail=False, methods=["get"])
    def sin_validar(self, request):

        qs = self.get_queryset().filter(
            validado=False,
            rechazado=False,
        )

        serializer = self.get_serializer(
            qs,
            many=True,
        )

        return Response(serializer.data)

    # VALIDAR
    @action(detail=True, methods=["put"])
    def validar(self, request, *args, **kwargs):
        solicitud = self.get_object()

        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)

        if "adolescente" in data and isinstance(data["adolescente"], str):
            try:
                data["adolescente"] = json.loads(data["adolescente"])
            except json.JSONDecodeError:
                return Response(
                    {"adolescente": "El campo adolescente debe contener JSON válido."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = SolicitudWriteSerializer(
            instance=solicitud,
            data=data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        solicitud = validar_solicitud(
            solicitud=solicitud,
            datos_validados=serializer.validated_data,
        )

        return Response(SolicitudWriteSerializer(solicitud).data)

    # RECHAZAR
    @action(detail=True, methods=["put"])
    def rechazar(self, request, pk=None):
        solicitud = self.get_object()

        motivo = request.query_params.get("motivo")

        if not motivo:
            raise ValidationError({"motivo": "El motivo es requerido."})

        solicitud = rechazar_solicitud(
            solicitud=solicitud, 
            motivo=motivo
        )

        return Response(self.get_serializer(solicitud).data)
    
    # DERIVAR
    @action(detail=True, methods=["put"])
    def derivar(self, request, pk=None):
        solicitud = self.get_object()

        equipo_id = request.data.get("equipo_id")

        if not equipo_id:
            raise ValidationError({"equipo_id": "El ID del equipo es requerido para derivar."})

        solicitud = derivar_solicitud(
            solicitud=solicitud,
            equipo_id=equipo_id
        )

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

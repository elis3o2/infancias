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
from .permissions import SolicitudPermission
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
            "fecha_hora_modificacion",
            "fecha_hora_creacion",
        )
    ).order_by("-fecha_orden")

    serializer_class = SolicitudSerializer

    def get_serializer_class(self):
        if self.action in [
            "list",
            "validados",
            "sin_validar",
            "rechazados",
        ]:
            return SolicitudListSerializer

        return SolicitudSerializer

    # ---------------------------------------------------------
    # QUERYSET SEGUN GRUPO
    # ---------------------------------------------------------

    def get_queryset(self):
        qs = super().get_queryset()
        desde = self.request.query_params.get("desde")
        hasta = self.request.query_params.get("hasta")

        if desde:
            qs = qs.filter(fecha_orden__date__gte=desde)

        if hasta:
            qs = qs.filter(fecha_orden__date__lte=hasta)
        # create es público, pero cualquier consulta
        # necesita usuario autenticado.
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
                derivacion__nombre__iexact="Grupo de Guardia",
            )

        # ADMISION:
        # solamente solicitudes validadas y derivadas a admision.
        if user.groups.filter(name="admision").exists():
            return qs.filter(
                validado=True,
                rechazado=False,
                derivacion__nombre__iexact="Grupo de Admisión",
            )

        # Usuario autenticado pero sin grupo
        return qs.none()

    # ---------------------------------------------------------
    # CREAR
    # ---------------------------------------------------------

    @transaction.atomic
    def create(self, request, *args, **kwargs):

        data = {}

        for key in request.data.keys():
            if key == "archivos":
                continue

            data[key] = request.data.get(key)

        for campo in (
            "adolescente",
            "solicitante",
            "institucion",
        ):
            if campo in data:
                data[campo] = json.loads(data[campo])

        serializer = self.get_serializer(data=data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        solicitud = serializer.save()

        for file in request.FILES.getlist("archivos"):
            Archivo.objects.create(
                solicitud=solicitud,
                nombre=file.name,
                tipo_mime=file.content_type,
                contenido=file.read(),
            )

        enviar_correo(
            subject="FORMULARIO PROBLEMÁTICA",
            body="La solicitud fue enviada correctamente.",
            to_emails=[solicitud.correo],
        )

        return Response(
            self.get_serializer(solicitud).data,
            status=status.HTTP_201_CREATED,
        )

    # ---------------------------------------------------------
    # MODIFICAR
    # ---------------------------------------------------------

    def update(self, request, *args, **kwargs):

        solicitud = self.get_object()

        # Solo Entrada debería llegar hasta acá por Permission,
        # pero mantenemos esta protección en el ViewSet.
        if solicitud.validado or solicitud.rechazado:
            return Response(
                {
                    "error": (
                        "Una solicitud validada "
                        "no puede modificarse."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().update(
            request,
            *args,
            **kwargs,
        )

    def partial_update(self, request, *args, **kwargs):

        solicitud = self.get_object()

        if solicitud.validado:
            return Response(
                {
                    "error": (
                        "Una solicitud validada "
                        "no puede modificarse."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().partial_update(
            request,
            *args,
            **kwargs,
        )


    # ---------------------------------------------------------
    # SIN VALIDAR
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # RECHAZADOS
    # ---------------------------------------------------------

    @action(detail=False, methods=["get"])
    def rechazados(self, request):

        qs = self.get_queryset().filter(
            rechazado=True,
        )

        serializer = self.get_serializer(
            qs,
            many=True,
        )

        return Response(serializer.data)

    # ---------------------------------------------------------
    # VALIDADOS
    # ---------------------------------------------------------

    @action(detail=False, methods=["get"])
    def validados(self, request):

        qs = self.get_queryset().filter(
            validado=True,
            rechazado=False,
        )

        serializer = self.get_serializer(
            qs,
            many=True,
        )

        return Response(serializer.data)

    # ---------------------------------------------------------
    # VALIDAR
    # ---------------------------------------------------------

    @transaction.atomic
    def validar(self, request, *args, **kwargs):

        solicitud = self.get_object()

        # ==========================================
        # Verificar estado
        # ==========================================

        if solicitud.validado or solicitud.rechazado:
            return Response(
                {
                    "error": "La solicitud ya fue procesada."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ==========================================
        # Preparar datos
        # ==========================================

        data = {}
        for key in request.data.keys():

            if key == "archivos":
                continue

            data[key] = request.data.get(key)

        if "adolescente" in data:
            data["adolescente"] = json.loads(
                data["adolescente"]
            )

        serializer = SolicitudWriteSerializer(
            instance=solicitud,
            data=data,
            partial=True,
            context={
                "request": request
            }
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        solicitud = serializer.save()

        for file in request.FILES.getlist("archivos"):

            Archivo.objects.create(
                solicitud=solicitud,
                nombre=file.name,
                tipo_mime=file.content_type,
                contenido=file.read(),
                valido=True,
            )

        enviar_correo(
            subject="FORMULARIO PROBLEMÁTICA",
            body="Su solicitud fue aprobada.",
            to_emails=[
                solicitud.solicitante.correo
            ],
        )

        return Response(
            SolicitudSerializer(
                solicitud
            ).data
        )

    # ---------------------------------------------------------
    # RECHAZAR
    # ---------------------------------------------------------

    @action(detail=True, methods=["put"])
    def rechazar(self, request, pk=None):

        solicitud = self.get_object()

        # Una solicitud validada no puede rechazarse
        if solicitud.validado or solicitud.rechazado:
            return Response(
                {
                    "error": (
                        "Una solicitud validada "
                        "no puede rechazarse."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        motivo = request.query_params.get("motivo")

        if not motivo:
            return Response(
                {
                    "error": "motivo es requerido"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        solicitud.validado = False
        solicitud.rechazado = True
        solicitud.motivo_rechazo = motivo
        solicitud.fecha_hora_modificacion = timezone.now()

        solicitud.save(
            update_fields=[
                "validado",
                "rechazado",
                "motivo_rechazo",
                "fecha_hora_modificacion",
            ]
        )

        enviar_correo(
            subject="FORMULARIO PROBLEMÁTICA",
            body=(
                "Su solicitud fue rechazada. "
                "A continuación se detallan "
                "los motivos.\n\n"
                f"{motivo}"
            ),
            to_emails=[
                solicitud.solicitante.correo
            ],
        )

        return Response(
            self.get_serializer(solicitud).data
        )



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
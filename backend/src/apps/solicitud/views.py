import json
from pathlib import Path
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from django.http import HttpResponse
from django.utils import timezone
from django.utils.http import content_disposition_header
from django.db.models.functions import Coalesce
from .models import MotivoSolicitud, Solicitud, Archivo, SolicitudComentario
from .serializers import (MotivoSolicitudSerializer, ArchivoSerializer,
                        SolicitudListSerializer, SolicitudCreateSerializer, SolicitudReadSerializer, SolicitudValReadSerializer, SolicitudValidateSerializer)
from .permissions import SolicitudPermission
from .services import crear_solicitud, validar_solicitud, derivar_solicitud, rechazar_solicitud
from src.permissions import IsOperationalUser, ReadOnly
from rest_framework.exceptions import ValidationError

MAX_ARCHIVOS = 5
MAX_TAMANO_ARCHIVO = 10 * 1024 * 1024
MAX_TAMANO_TOTAL = 30 * 1024 * 1024
TIPOS_ARCHIVO_PERMITIDOS = {"application/pdf", "image/jpeg", "image/png"}
EXTENSIONES_ARCHIVO_PERMITIDAS = {".pdf", ".jpg", ".jpeg", ".png"}


class MotivoSolicitudViewSet(viewsets.ModelViewSet):
    queryset = MotivoSolicitud.objects.all()
    serializer_class = MotivoSolicitudSerializer
    permission_classes = [ReadOnly]


class SolicitudViewSet(viewsets.ModelViewSet):

    queryset = Solicitud.objects.annotate(
        fecha_orden=Coalesce(
            "fecha_hora_entrada",
            "fecha_hora_creacion",
        )
    ).order_by("-fecha_orden")

    serializer_class = SolicitudReadSerializer
    permission_classes = [SolicitudPermission]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action in {
            "list",
            "validados",
            "sin_validar",
            "rechazados",
        }:
            return SolicitudListSerializer

        if self.action == "create":
            return SolicitudCreateSerializer

        if self.action == "validar":
            return SolicitudValidateSerializer

        return SolicitudReadSerializer

    @staticmethod
    def _normalizar_campos_json(data, *campos):
        """Convierte campos JSON de multipart sin alterar cuerpos JSON nativos."""
        for campo in campos:
            valor = data.get(campo)
            if not isinstance(valor, str):
                continue

            try:
                data[campo] = json.loads(valor)
            except json.JSONDecodeError:
                return Response(
                    {campo: "El formato JSON es inválido."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return None

    @staticmethod
    def _validar_archivos(archivos):
        if len(archivos) > MAX_ARCHIVOS:
            raise ValidationError(
                {"archivos": f"Puede adjuntar como máximo {MAX_ARCHIVOS} archivos."}
            )

        total = 0
        for archivo in archivos:
            nombre = Path(archivo.name).name
            extension = Path(nombre).suffix.lower()
            tipo_mime = (archivo.content_type or "").lower()

            if extension not in EXTENSIONES_ARCHIVO_PERMITIDAS:
                raise ValidationError(
                    {"archivos": f"El archivo {nombre} no tiene un formato permitido."}
                )
            if (
                tipo_mime
                and tipo_mime != "application/octet-stream"
                and tipo_mime not in TIPOS_ARCHIVO_PERMITIDOS
            ):
                raise ValidationError(
                    {"archivos": f"El tipo informado para {nombre} no está permitido."}
                )
            if archivo.size > MAX_TAMANO_ARCHIVO:
                raise ValidationError(
                    {"archivos": f"El archivo {nombre} supera el máximo de 10 MB."}
                )

            total += archivo.size

        if total > MAX_TAMANO_TOTAL:
            raise ValidationError(
                {"archivos": "El total de archivos no puede superar los 30 MB."}
            )


    def retrieve(self, request, *args, **kwargs):
        solicitud = self.get_object()

        if solicitud.validado or solicitud.rechazado:
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

        user = self.request.user

        if not user.is_authenticated:
            return qs.none()

        if not user.equipo:
            return qs.none()

        qs = qs.filter(equipo=user.equipo)
        
        desde = self.request.query_params.get("desde")
        hasta = self.request.query_params.get("hasta")
        if desde:
            qs = qs.filter(fecha_orden__date__gte=desde)

        if hasta:
            qs = qs.filter(fecha_orden__date__lte=hasta)

        return qs
    
    # CREAR
    def create(self, request, *args, **kwargs):
        data = {
            key: value
            for key, value in request.data.items()
            if key != "archivos"
        }

        error = self._normalizar_campos_json(
            data,
            "adolescentes",
            "relaciones_adolescentes",
            "institucion",
        )
        if error is not None:
            return error

        archivos = request.FILES.getlist("archivos")
        self._validar_archivos(archivos)

        serializer = SolicitudCreateSerializer(data=data)

        if not serializer.is_valid():
            print("ERROR DE VALIDACIÓN:")
            print(serializer.errors)
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        solicitud = crear_solicitud(
            datos_solicitud=serializer.validated_data,
            archivos=archivos,
        )

        return Response(
            SolicitudReadSerializer(solicitud, context={"request": request}).data,
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

    @action(detail=False, methods=["get"])
    def validados(self, request):
        qs = self.get_queryset().filter(validado=True, rechazado=False)
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def rechazados(self, request):
        qs = self.get_queryset().filter(rechazado=True)
        return Response(self.get_serializer(qs, many=True).data)

    # VALIDAR
    @action(detail=True, methods=["put"])
    def validar(self, request, *args, **kwargs):
        solicitud = self.get_object()
        data = {
            key: request.data.get(key)
            for key in request.data.keys()
        }
        error = self._normalizar_campos_json(data, "adolescentes")
        if error is not None:
            return error

        serializer = SolicitudValidateSerializer(
            data=data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)
        solicitud = validar_solicitud(
            solicitud=solicitud,
            data=serializer.validated_data,
        )

        return Response(
            SolicitudValReadSerializer(solicitud, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )
    # RECHAZAR
    @action(detail=True, methods=["put"])
    def rechazar(self, request, pk=None):
        solicitud = self.get_object()

        motivo = (request.query_params.get("motivo") or "").strip()

        if not motivo:
            raise ValidationError({"motivo": "El motivo es requerido."})

        solicitud = rechazar_solicitud(solicitud=solicitud, motivo=motivo)

        return Response(
            SolicitudValReadSerializer(solicitud, context={"request": request}).data
        )
    
    # DERIVAR
    @action(detail=True, methods=["put"])
    def derivar(self, request, pk=None):
        solicitud = self.get_object()

        equipo_id = (
            request.data.get("equipo_id")
            or request.query_params.get("equipo_id")
        )

        if not equipo_id:
            raise ValidationError({
                "equipo_id": (
                    "El ID del equipo es requerido para derivar."
                )
            })

        derivar_solicitud(solicitud=solicitud, equipo_id=equipo_id)
        return Response(status=status.HTTP_200_OK)
    
    @action(detail=True, methods=["post"])
    def comentar(self, request, pk=None):
        solicitud = self.get_object()

        comentario = request.data.get("comentario")

        if not comentario:
            return Response(
                {"error": "El comentario es obligatorio"},
                status=status.HTTP_400_BAD_REQUEST
            )

        SolicitudComentario.objects.create(
            solicitud=solicitud,
            comentario=comentario,
            fecha_hora_creacion=timezone.now(),
            fecha_hora_ultmod=timezone.now(),
            usuario=request.user,
        )

        return Response(
            status=status.HTTP_201_CREATED
        )

class ArchivoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ArchivoSerializer
    permission_classes = [IsOperationalUser]

    def get_queryset(self):
        user = self.request.user
        if not getattr(user, "equipo_id", None):
            return Archivo.objects.none()
        return Archivo.objects.filter(solicitud__equipo_id=user.equipo_id)

    @action(detail=True, methods=["get"])
    def descargar(self, request, pk=None):
        archivo = self.get_object()

        response = HttpResponse(
            archivo.contenido,
            content_type=archivo.tipo_mime or "application/octet-stream"
        )

        response["Content-Disposition"] = content_disposition_header(
            True,
            Path(archivo.nombre).name,
        )

        return response

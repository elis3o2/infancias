import json
import traceback
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
from .models import PrioridadSolicitud, MotivoSolicitud, Solicitud, Archivo, SolicitudComentario
from .serializers import (PrioridadSolicitudSerializer, MotivoSolicitudSerializer, ArchivoSerializer, 
                        SolicitudListSerializer, SolicitudCreateSerializer, SolicitudReadSerializer, SolicitudValReadSerializer, SolicitudWriteSerializer)
from .permissions import SolicitudPermission
from .services import crear_solicitud, validar_solicitud, derivar_solicitud, rechazar_solicitud
from src.permissions import ReadOnly
from src.utils import enviar_correo
from rest_framework.exceptions import ValidationError

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

        # Convertir QueryDict a dict normal
        data = {
            key: request.data.get(key)
            for key in request.data.keys()
        }

        # Normalizar adolescente
        if "adolescente" in data:

            adolescente_data = data["adolescente"]

            if isinstance(adolescente_data, str):
                try:
                    adolescente_data = json.loads(adolescente_data)
                except json.JSONDecodeError:
                    return Response(
                        {
                            "adolescente": (
                                "El campo adolescente debe contener JSON válido."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            elif isinstance(adolescente_data, list):
                if not adolescente_data:
                    return Response(
                        {
                            "adolescente": (
                                "Los datos del adolescente son obligatorios."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                adolescente_data = adolescente_data[0]

            data["adolescente"] = adolescente_data

        print("\n========== DATA NORMALIZADA ==========")
        print(data)

        serializer = SolicitudWriteSerializer(
            instance=solicitud,
            data=data,
            partial=True,
            context={"request": request},
        )

        if not serializer.is_valid():
            print("ERROR SERIALIZER:")
            print(serializer.errors)

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        print("\n========== VALIDATED DATA ==========")
        print(serializer.validated_data)

        try:
            solicitud = validar_solicitud(
                solicitud=solicitud,
                data=serializer.validated_data,
            )

        except ValidationError as e:
            print("\n========== VALIDATION ERROR ==========")
            print("TYPE:", type(e).__name__)
            print("DETAIL:", repr(e.detail))
            print("======================================\n")

            return Response(
                {
                    "detail": "Error al validar la solicitud",
                    "errors": e.detail,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            import traceback

            print("\n========== UNEXPECTED ERROR ==========")
            print("TYPE:", type(e).__name__)
            print("ERROR:", str(e))
            traceback.print_exc()
            print("======================================\n")

            raise

        return Response(status=status.HTTP_200_OK)
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

        equipo_id = (
            request.data.get("equipo_id")
            or request.query_params.get("equipo_id")
        )

        print("\n========== DERIVAR ==========")
        print("Solicitud:", solicitud.id)
        print("Request data:", request.data)
        print("Query params:", request.query_params)
        print("Equipo ID:", equipo_id)

        if not equipo_id:
            raise ValidationError({
                "equipo_id": (
                    "El ID del equipo es requerido para derivar."
                )
            })

        try:
            solicitud = derivar_solicitud(
                solicitud=solicitud,
                equipo_id=equipo_id,
            )

        except ValidationError as exc:
            print("\n========== VALIDATION ERROR ==========")
            print("TYPE:", type(exc).__name__)
            print("DETAIL:", exc.detail)
            print("======================================\n")
            raise

        except Exception as exc:
            print("\n========== ERROR AL DERIVAR ==========")
            print("TYPE:", type(exc).__name__)
            print("DETAIL:", str(exc))
            traceback.print_exc()
            print("======================================\n")

            return Response(
                {
                    "error": type(exc).__name__,
                    "detail": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=["post"])
    def comentar(self, request, pk=None):
        solicitud = self.get_object()

        comentario = request.data.get("comentario")

        if not comentario:
            return Response(
                {"error": "El comentario es obligatorio"},
                status=status.HTTP_400_BAD_REQUEST
            )

        comentario_obj = SolicitudComentario.objects.create(
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

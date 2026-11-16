"""Adaptadores HTTP de los casos de uso de solicitudes."""
from pathlib import Path

from django.http import HttpResponse
from django.utils.http import content_disposition_header
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework.permissions import IsAuthenticated
from src.permissions import ReadOnly
from .models import MotivoSolicitud, Solicitud
from .permissions import SolicitudPermission
from .serializers import (
    AdolescenteAdmisionSerializer, ArchivoSerializer, FamiliarAdmisionSerializer,
    FiltrosReporteSerializer, FiltrosSolicitudesSerializer, MotivoSolicitudSerializer,
    SolicitudComentarioSerializer, SolicitudCreateSerializer, SolicitudDerivarSerializer,
    SolicitudListSerializer, SolicitudReadSerializer, SolicitudRechazarSerializer,
    SolicitudReporteSerializer, SolicitudValidateSerializer, SolicitudValReadSerializer,
)
from .services import (
    agregar_adolescente, agregar_familiar, archivos_visibles, crear_comentario,
    crear_solicitud, derivar_solicitud, editar_comentario, generar_reporte,
    obtener_reporte_solicitudes, obtener_solicitudes, rechazar_solicitud,
    validar_archivos, validar_solicitud,
)
from .utils import normalizar_campos_json


class MotivoSolicitudViewSet(viewsets.ModelViewSet):
    queryset = MotivoSolicitud.objects.all()
    serializer_class = MotivoSolicitudSerializer
    permission_classes = [ReadOnly]


class SolicitudViewSet(viewsets.ModelViewSet):
    queryset = Solicitud.objects.all()
    serializer_class = SolicitudReadSerializer
    permission_classes = [SolicitudPermission]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action in {"list", "validados", "sin_validar", "rechazados"}:
            return SolicitudListSerializer
        if self.action == "create":
            return SolicitudCreateSerializer
        if self.action == "validar":
            return SolicitudValidateSerializer
        return SolicitudReadSerializer

    def get_queryset(self):
        filtros = FiltrosSolicitudesSerializer(data={
            campo: self.request.query_params[campo]
            for campo in ("desde", "hasta") if self.request.query_params.get(campo)
        })
        filtros.is_valid(raise_exception=True)
        return obtener_solicitudes(
            super().get_queryset(), self.request.user, self.action,
            **filtros.validated_data,
        )

    def retrieve(self, request, *args, **kwargs):
        solicitud = self.get_object()
        clase_serializer = (
            SolicitudValReadSerializer
            if solicitud.validado or solicitud.rechazado
            else SolicitudReadSerializer
        )
        return Response(
            clase_serializer(solicitud, context={"request": request}).data
        )

    def create(self, request, *args, **kwargs):
        data = {
            key: value
            for key, value in request.data.items()
            if key != "archivos"
        }
        normalizar_campos_json(
            data,
            "adolescentes",
            "relaciones_adolescentes",
            "institucion",
        )

        archivos = request.FILES.getlist("archivos")
        validar_archivos(archivos)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        solicitud = crear_solicitud(
            datos_solicitud=serializer.validated_data,
            archivos=archivos,
        )
        return Response(
            SolicitudReadSerializer(
                solicitud, context={"request": request}
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"])
    def sin_validar(self, request):
        queryset = self.get_queryset()
        return Response(self.get_serializer(queryset, many=True).data)

    @action(detail=False, methods=["get"])
    def validados(self, request):
        queryset = self.get_queryset()
        return Response(self.get_serializer(queryset, many=True).data)

    @action(detail=False, methods=["get"])
    def rechazados(self, request):
        queryset = self.get_queryset()
        return Response(self.get_serializer(queryset, many=True).data)

    @action(detail=True, methods=["put"])
    def validar(self, request, *args, **kwargs):
        solicitud = self.get_object()
        data = {
            key: request.data.get(key)
            for key in request.data.keys()
        }
        normalizar_campos_json(data, "adolescentes")

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        solicitud = validar_solicitud(
            solicitud=solicitud,
            data=serializer.validated_data,
        )
        return Response(
            SolicitudValReadSerializer(
                solicitud, context={"request": request}
            ).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["put"])
    def rechazar(self, request, pk=None):
        solicitud = self.get_object()
        serializer = SolicitudRechazarSerializer(data={
            "motivo": request.data.get("motivo") or request.query_params.get("motivo") or "",
        })
        serializer.is_valid(raise_exception=True)
        solicitud = rechazar_solicitud(solicitud=solicitud, **serializer.validated_data)
        return Response(
            SolicitudValReadSerializer(solicitud, context={"request": request}).data
        )

    @action(detail=True, methods=["put"])
    def derivar(self, request, pk=None):
        solicitud = self.get_object()
        equipo_id = request.data.get("equipo_id") or request.query_params.get("equipo_id")
        serializer = SolicitudDerivarSerializer(data={"equipo_id": equipo_id} if equipo_id else {})
        serializer.is_valid(raise_exception=True)
        derivar_solicitud(solicitud=solicitud, **serializer.validated_data)
        return Response(status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="familiares")
    def agregar_familiar(self, request, pk=None):
        solicitud = self.get_object()
        serializer = FamiliarAdmisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        solicitud = agregar_familiar(
            solicitud, request.user, serializer.validated_data
        )
        return Response(
            SolicitudValReadSerializer(
                solicitud, context={"request": request}
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="adolescentes")
    def agregar_adolescente(self, request, pk=None):
        solicitud = self.get_object()
        serializer = AdolescenteAdmisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        solicitud = agregar_adolescente(
            solicitud, request.user, serializer.validated_data
        )
        return Response(
            SolicitudValReadSerializer(
                solicitud, context={"request": request}
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def comentar(self, request, pk=None):
        solicitud = self.get_object()
        serializer = SolicitudComentarioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comentario = crear_comentario(
            solicitud, request.user, serializer.validated_data["comentario"]
        )
        return Response(
            SolicitudComentarioSerializer(
                comentario, context={"request": request}
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path=r"comentarios/(?P<comentario_id>[0-9]+)",
    )
    def editar_comentario(self, request, pk=None, comentario_id=None):
        solicitud = self.get_object()
        serializer = SolicitudComentarioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comentario = editar_comentario(
            solicitud,
            comentario_id,
            request.user,
            serializer.validated_data["comentario"],
        )
        return Response(
            SolicitudComentarioSerializer(
                comentario, context={"request": request}
            ).data
        )

    @action(detail=False, methods=["get"], url_path="stats")
    def get_stats(self, request):
        return Response(generar_reporte(self.get_queryset()))


class ArchivoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ArchivoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return archivos_visibles(self.request.user)

    @action(detail=True, methods=["get"])
    def descargar(self, request, pk=None):
        archivo = self.get_object()
        response = HttpResponse(
            archivo.contenido,
            content_type=archivo.tipo_mime or "application/octet-stream",
        )
        response["Content-Disposition"] = content_disposition_header(
            True,
            Path(archivo.nombre).name,
        )
        return response


class ReportesSolicitudAPIView(APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "head", "options"]

    def get(self, request):
        filtros = FiltrosReporteSerializer(data=request.query_params)
        filtros.is_valid(raise_exception=True)
        reporte = obtener_reporte_solicitudes(filtros.validated_data)
        paginador = PageNumberPagination()
        paginador.page_size = 20
        pagina = paginador.paginate_queryset(reporte.solicitudes, request)
        return Response({
            "general": reporte.general,
            "periodo": {"desde": reporte.desde, "hasta": reporte.hasta},
            "resumen": reporte.resumen,
            "solicitudes": {
                "pagina": paginador.page.number,
                "count": paginador.page.paginator.count,
                "next": paginador.get_next_link(),
                "previous": paginador.get_previous_link(),
                "results": SolicitudReporteSerializer(pagina, many=True).data,
            },
        })

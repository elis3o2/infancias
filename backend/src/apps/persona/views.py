from rest_framework import status, viewsets
from rest_framework.request import Request
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.db.models import Case, When, Value, IntegerField
from .models import Adolescente, Familiar, Vinculo, RelacionAdolescente
from .serializers import (
    BusquedaHistorialSerializer, NinoHistorialSerializer, SolicitudHistorialSerializer,
    AdolescenteReadSerializer,
    ConsultaPersonasSerializer,
    FamiliarSerializer,
    VinculoSerializer,
    RelacionAdolescenteSerializer,
)
from .services import consultar_personas
from .historial import buscar_ninos, datos_nino, ninos_historial, registros_identificados, solicitudes_del_nino
from src.apps.api_externa.errores import respuesta_error_servicio
from src.apps.api_externa.types import ServicioExternoError
from src.permissions import IsOperationalUser, ReadOnly
import json




class AdolescenteViewSet(viewsets.ModelViewSet):
    serializer_class = AdolescenteReadSerializer
    permission_classes = [IsOperationalUser, ReadOnly]

    def get_queryset(self):
        user = self.request.user
        if not getattr(user, "equipo_id", None):
            return Adolescente.objects.none()
        return Adolescente.objects.filter(solicitud__equipo_id=user.equipo_id)


class FamiliarViewSet(viewsets.ModelViewSet):
    serializer_class = FamiliarSerializer
    permission_classes = [IsOperationalUser, ReadOnly]

    def get_queryset(self):
        user = self.request.user
        if not getattr(user, "equipo_id", None):
            return Familiar.objects.none()
        return Familiar.objects.filter(solicitud__equipo_id=user.equipo_id)


class VinculoViewSer(viewsets.ModelViewSet):
    serializer_class = VinculoSerializer
    permission_classes = [ReadOnly]

    def get_queryset(self):
        return (
            Vinculo.objects
            .annotate(
                orden_otros=Case(
                    When(nombre="Otro", then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
            .order_by("orden_otros", "nombre")
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset().filter(adolescente=False)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="adolescente")
    def adolescente(self, request):
        queryset = self.get_queryset().filter(adolescente=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class RelacionAdolescenteViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RelacionAdolescenteSerializer
    permission_classes = [IsOperationalUser, ReadOnly]

    def get_queryset(self):
        equipo_id = getattr(self.request.user, "equipo_id", None)
        if equipo_id is None:
            return RelacionAdolescente.objects.none()
        return RelacionAdolescente.objects.filter(
            adolescente1__solicitud__equipo_id=equipo_id,
            adolescente2__solicitud__equipo_id=equipo_id,
        ).select_related("vinculo")


class ConsultaPersonasAPIView(APIView):
    permission_classes = [IsOperationalUser]

    def get(self, request: Request) -> Response:
        try:
            data = {
                campo: json.loads(request.query_params.get(campo, "[]"))
                for campo in ("adolescentes", "familiares")
            }
        except (TypeError, ValueError):
            return Response({"detail": "El formato JSON es inválido."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ConsultaPersonasSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        try:
            return Response(consultar_personas(**serializer.validated_data))
        except ServicioExternoError as exc:
            return respuesta_error_servicio(exc)


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

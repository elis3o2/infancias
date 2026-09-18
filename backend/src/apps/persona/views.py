from rest_framework import status, viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from decouple import config
from django.db.models import Case, When, Value, IntegerField
from .models import Adolescente, Familiar, Vinculo
from .serializers import (
    AdolescenteCreateSerializer,
    ConsultaPersonasSerializer,
    FamiliarSerializer,
    VinculoSerializer,
)
from .services import consultar_ciudadano, consultar_personas
from src.permissions import IsOperationalUser, ReadOnly
from typing import Any
import requests
import json

class AdolescenteViewSet(viewsets.ModelViewSet):
    serializer_class = AdolescenteCreateSerializer
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
    queryset = (
        Vinculo.objects
        .annotate(
            orden_otros=Case(
                When(nombre="Otro", then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            )
        )
        .order_by("orden_otros", "nombre"))


class HistoriaClinicaView(APIView):
    permission_classes = [IsOperationalUser]

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        documento = request.query_params.get("dni")
        sexo = request.query_params.get("sexo")

        if not documento or not sexo:
            return Response(
                {"error": "Falta documento y/o sexo"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        url = config("API_HC", default="")
        if not url:
            return Response(
                {"detail": "El servicio de historia clínica no está configurado."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            session = requests.Session()
            session.trust_env = False

            response = session.get(
                url,
                params={
                    "api_key": config("KEY_HC", default=""),
                    "documento": documento,
                    "sexo": sexo,
                },
                timeout=10,
            )

            response.raise_for_status()

            data = response.json()
            resultado = {
                "adscripcion": [
                    item["adscripcion"]
                    for item in data.get("results_query1", [])
                    if item.get("adscripcion")
                ],
                "efectores": list(
                    dict.fromkeys(
                        item.get("efector")
                        for item in data.get("results_query2", [])
                        if item.get("efector")
                    )
                ),
                "obra_social": list(
                    dict.fromkeys(
                        item.get("nombreObraSocial")
                        for item in data.get("sisa_data", {}).get("coberturas", [])
                        if item.get("nombreObraSocial")
                    )
                )
            }
            return Response(resultado, status=status.HTTP_200_OK)

        except (requests.RequestException, ValueError, TypeError):
            return Response(
                {"detail": "No fue posible consultar la historia clínica."},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class CiudadanoDataViewSet(APIView):
    """Compatibilidad para integraciones que aún usan la consulta individual."""

    permission_classes = [IsOperationalUser]

    def get(self, request: Request) -> Response:
        dni = request.query_params.get("dni")
        sexo = request.query_params.get("sexo")

        if not (dni and sexo):
            return Response(
                {"detail": "Falta documento y/o sexo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ciudadano = consultar_ciudadano(dni=dni.strip(), sexo=sexo.strip().upper())
        if ciudadano is None:
            return Response(
                {"detail": "No se encontraron datos para la persona."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(ciudadano, status=status.HTTP_200_OK)
class ConsultaPersonasAPIView(APIView):
    permission_classes = [IsOperationalUser]

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        # Compatibilidad con la consulta individual utilizada por formularios
        # anteriores. La pantalla de validación usa el modo por lotes.
        dni = request.query_params.get("dni")
        sexo = request.query_params.get("sexo")
        if dni is not None or sexo is not None:
            if not dni or not sexo:
                return Response(
                    {"detail": "Falta documento y/o sexo."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            ciudadano = consultar_ciudadano(dni=dni.strip(), sexo=sexo.strip().upper())
            if ciudadano is None:
                return Response(
                    {"detail": "No se encontraron datos para la persona."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response(ciudadano, status=status.HTTP_200_OK)

        adolescentes_raw = request.query_params.get("adolescentes")
        familiares_raw = request.query_params.get("familiares")

        try:
            adolescentes = json.loads(adolescentes_raw or "[]")
            familiares = json.loads(familiares_raw or "[]")

        except json.JSONDecodeError:
            return Response(
                {"error": "JSON inválido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ConsultaPersonasSerializer(
            data={
                "adolescentes": adolescentes,
                "familiares": familiares,
            }
        )

        serializer.is_valid(raise_exception=True)

        resultado = consultar_personas(
            adolescentes=serializer.validated_data.get("adolescentes", []),
            familiares=serializer.validated_data.get("familiares", []),
            equipo_id=request.user.equipo_id,
        )

        return Response(
            resultado,
            status=status.HTTP_200_OK,
        )

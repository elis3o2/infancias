from rest_framework import viewsets, status
from rest_framework.exceptions import NotFound, APIException
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from decouple import config
from django.db.models import Case, When, Value, IntegerField
from django.db import transaction
from .models import Adolescente, Familiar, Hermano, Vinculo
from .serializers import (AdolescenteCreateSerializer, FamiliarSerializer, HermanoSerializer,
                                VinculoSerializer)
from src.permissions import ReadOnly
from typing import Any, cast
import requests


class AdolescenteViewSet(viewsets.ModelViewSet):
    queryset = Adolescente.objects.all()
    serializer_class = AdolescenteCreateSerializer


class FamiliarViewSet(viewsets.ModelViewSet):
    queryset = Familiar.objects.all()
    serializer_class = FamiliarSerializer


class HermanoViewSet(viewsets.ModelViewSet):
    queryset = Hermano.objects.all()
    serializer_class = HermanoSerializer



class VinculoViewSer(viewsets.ModelViewSet):
    serializer_class = VinculoSerializer
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
    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        documento = request.query_params.get("dni")
        sexo = request.query_params.get("sexo")

        if not documento or not sexo:
            return Response(
                {"error": "Falta documento y/o sexo"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        url = cast(str, config("API_HC"))

        try:
            session = requests.Session()
            session.trust_env = False

            response = session.get(
                url,
                params={
                    "api_key": config("KEY_HC"),
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
            print(resultado)
            return Response(resultado, status=status.HTTP_200_OK)

        except Exception as exc:
            print(str(exc))
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class CiudadanoDataViewSet(APIView):
    def get(self, request: Request) -> Response:
        dni:  str | None = request.query_params.get("dni")
        sexo: str | None = request.query_params.get("sexo")

        if not (dni and sexo):
            return Response(
                {"error": "`dni` and `sexo` are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        url = f"{config('API_CIUDADANO')}?dni={dni}&sexo={sexo}&api_key={config('CIUDADANO_KEY')}"
        print(url)
        try:
            response = requests.get(url, timeout=10)
            print(response)
            if response.status_code == 404:
                raise NotFound()
            response.raise_for_status()
            data = response.json()
            result = data.get("ciudadano")
            return Response(result)
        except NotFound:
            raise
        except requests.RequestException as exc:
            raise APIException(detail=f"External API error: {str(exc)}")
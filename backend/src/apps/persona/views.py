from rest_framework import viewsets
from rest_framework.exceptions import NotFound, APIException
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from decouple import config
from .models import Persona, Escolaridad, CCB, ObraSocial, Menor
from .serializers import PersonaSerializer, EscolaridadSerializer, CCBSerializer, ObraSocialSerializer, MenorSerializer
from src.permissions import ReadOnly
from typing import Any
import requests

class PersonaViewSet(viewsets.ModelViewSet):
    queryset = Persona.objects.all()
    serializer_class = PersonaSerializer


class EscolaridaViewSet(viewsets.ModelViewSet):
    queryset = Escolaridad.objects.all()
    serializer_class = EscolaridadSerializer
    permission_classes = [ReadOnly]


class CCBViewSet(viewsets.ModelViewSet):
    queryset = CCB.objects.all()
    serializer_class = CCBSerializer
    permission_classes = [ReadOnly]


class ObraSocialViewSet(viewsets.ModelViewSet):
    queryset = ObraSocial.objects.all()
    serializer_class = ObraSocialSerializer
    permission_classes = [ReadOnly]


class MenorViewSet(viewsets.ModelViewSet):
    queryset = Menor.objects.all()
    serializer_class = MenorSerializer
    



class HistoriaClinicaView(APIView):
    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        documento = request.query_params.get("documento")
        sexo = request.query_params.get("sexo")

        if not documento or not sexo:
            return Response(
                {"error": "Falta documento y/o sexo"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        BASE_URL = cast(str, config("API_HC"))
        url = f"{BASE_URL}&documento={documento}&sexo={sexo}"

        try:
            response = requests.get(
                url,
                timeout=10,
            )

            response.raise_for_status()

            return Response(response.json(), status=status.HTTP_200_OK)

        except Exception as exc:
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
import requests
from pyproj import Transformer
from decouple import config
from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.viewsets import ViewSet
from rest_framework.exceptions import NotFound, APIException
from .models import Institucion, TipoInstitucion, Provincia, Departamento, Domicilio
from .serializers import (ProvinciaSerializer, DepartamentoSerializer, InstitucionSerializer, TipoInstitucionSerializer,
                        DomicilioSerializer)
from src.permissions import ReadOnly

class ProvinciaViewSet(viewsets.ModelViewSet):
    queryset = Provincia.objects.all()
    serializer_class = ProvinciaSerializer
    permission_classes = [ReadOnly]


class DepartamentoViewSet(viewsets.ModelViewSet):
    serializer_class = DepartamentoSerializer
    permission_classes = [ReadOnly]

    def get_queryset(self):
        queryset = Departamento.objects.all()

        id_provincia = self.request.query_params.get("id_provincia")

        if id_provincia:
            queryset = queryset.filter(provincia__id=id_provincia)

        return queryset

class TipoInstitucionViewSet(viewsets.ModelViewSet):
    queryset = TipoInstitucion.objects.all()
    serializer_class = TipoInstitucionSerializer
    permission_classes = [ReadOnly]


class InstitucionViewSet(viewsets.ModelViewSet):
    queryset = Institucion.objects.all()
    serializer_class = InstitucionSerializer
    permission_classes = [ReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()

        # Solo instituciones con domicilio validado
        qs = qs.filter(domicilio__domicilio_validado__isnull=False)

        id_tipo = self.request.query_params.get("id_tipo")

        if id_tipo:
            qs = qs.filter(tipo_id=id_tipo)

        return qs

    @action(detail=False, methods=["get"], url_path="educacion")
    def educacion(self, request):
        qs = self.get_queryset().filter(tipo__educacion=True)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="territorial")
    def territorial(self, request):
        qs = self.get_queryset().filter(tipo__territorial=True)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)



class DomicilioViewSet(viewsets.ModelViewSet):
    queryset = Domicilio.objects.all()
    serializer_class = DomicilioSerializer




class GeoDataViewSet(ViewSet):

    @action(detail=False, methods=["get"], url_path="features")
    def features(self, request: Request) -> Response:
        domicilio: str | None = request.query_params.get("domicilio")

        if not domicilio:
            return Response(
                {"error": "`domicilio` parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        url = f"{config('API_GEO1')}{domicilio}"

        try:
            response = requests.get(
                url,
                timeout=10,
                proxies={"http": None, "https": None},  # type: ignore[arg-type]
                verify=True,
            )

            if response.status_code == 404:
                raise NotFound()

            response.raise_for_status()

            data = response.json()
            features = data.get("features", [])

            result = []

            for feature in features:
                geometry = feature.get("geometry")
                properties = feature.get("properties", {})

                if (
                    geometry is None
                    or geometry.get("type") != "Point"
                    or "nombreCalle" not in properties
                ):
                    continue

                coordinates = geometry.get("coordinates")

                if not coordinates or len(coordinates) < 2:
                    continue

                x, y = coordinates
                lat, lon = transformar_coordenadas(x, y)

                result.append(
                    {
                        "altura": properties.get("altura"),
                        "bis": properties.get("bis"),
                        "codigoCalle": properties.get("codigoCalle"),
                        "codigoInterseccion": properties.get("codigoInterseccion"),
                        "id": str(properties.get("id")),
                        "letra": properties.get("letra"),
                        "name": properties.get("name"),
                        "nombreCalle": properties.get("nombreCalle"),
                        "nombreInterseccion": properties.get("nombreInterseccion"),
                        "coordenada_x": x,
                        "coordenada_y": y,
                        "longitud": lon,
                        "latitud": lat,
                    }
                )

            return Response(result)

        except NotFound:
            raise

        except requests.RequestException as exc:
            raise APIException(detail=f"External API error: {str(exc)}")
    
    @action(detail=False, methods=["get"], url_path="direccion")
    def direccion(self, request: Request) -> Response:
        codigo_calle: str | None = request.query_params.get("codigoCalle")
        altura: str | None = request.query_params.get("altura")
        bis: str | None = request.query_params.get("bis")
        letra: str | None = request.query_params.get("letra")

        if not (codigo_calle and altura and bis):
            return Response(
                {"error": "`codigoCalle`, `altura` and `bis` are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        url = (
            f"{config('API_GEO2')}"
            f"?idCalle={codigo_calle}"
            f"&altura={altura}"
            f"&bis={bis}"
            f"{f'&letra={letra}' if letra else ''}"
        )

        try:
            response = requests.get(
                url,
                timeout=10,
                proxies={"http": None, "https": None},  # type: ignore[arg-type]
                verify=True,
            )

            if response.status_code == 404:
                raise NotFound()

            response.raise_for_status()

            data = response.json()

            divs_admins = data.get("divsAdmins", [])

            resultado = {
                "distrito": None,
                "vecinal": None,
                "barrio": None,
                "seccional_policial": None,
                "fraccion_sensal": None,
                "radio_sensal": None,
                "identidad_barrial": None,
                "localidad": data.get("localidad"),
                "puntoX": data.get("puntoX"),
                "puntoY": data.get("puntoY"),
            }

            for division in divs_admins:
                tipo = division.get("nombreTipo")
                codigo = division.get("codigo")
                nombre = division.get("valor")

                if tipo == "Distrito":
                    resultado["distrito"] = {
                        "id": int(codigo),
                        "nombre": nombre,
                    }

                elif tipo == "Vecinal":
                    resultado["vecinal"] = {
                        "id": int(codigo),
                        "nombre": nombre,
                    }

                elif tipo == "Barrio":
                    resultado["barrio"] = {
                        "id": int(codigo),
                        "nombre": nombre,
                    }

                elif tipo == "Seccional Policial":
                    resultado["seccional_policial"] = {
                        "id": int(codigo),
                        "nombre": nombre,
                    }

                elif tipo == "Fracción Censal":
                    resultado["fraccion_sensal"] = int(codigo)

                elif tipo == "Radio Censal":
                    resultado["radio_sensal"] = int(codigo)

                elif tipo == "Identidad Barrial":
                    resultado["identidad_barrial"] = {
                        "id": int(codigo),
                        "nombre": nombre,
                    }

            return Response(resultado)

        except NotFound:
            raise

        except requests.RequestException as exc:
            raise APIException(
                detail=f"External API error: {str(exc)}"
            )
    @action(detail=False, methods=["get"], url_path="latitud-longitud")
    def latitud_longitud(self, request: Request) -> Response:
        punto_x: str | None = request.query_params.get("punto_x")
        punto_y: str | None = request.query_params.get("punto_y")

        if not (punto_x and punto_y):
            return Response(
                {"error": "`punto_x` and `punto_y` are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        url = f"{config('API_GEO3')}{punto_x}/{punto_y}/"

        try:
            response = requests.get(
                url,
                timeout=10,
                proxies={"http": None, "https": None},  # type: ignore[arg-type]
                verify=True,
            )
            if response.status_code == 404:
                raise NotFound()
            response.raise_for_status()
            return Response(response.json())
        except NotFound:
            raise
        except requests.RequestException as exc:
            raise APIException(detail=f"External API error: {str(exc)}")

def transformar_coordenadas(x, y):
    transformer = Transformer.from_crs("epsg:22185", "epsg:4326", always_xy=True)

    lon, lat = transformer.transform(x, y)

    return [lat, lon]
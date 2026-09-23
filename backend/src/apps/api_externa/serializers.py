from rest_framework import serializers
from typing import TypedDict


class ConsultaPersonaExternaDatos(TypedDict):
    dni: str
    sexo: str


class ConsultaPersonaExternaSerializer(serializers.Serializer):
    dni = serializers.CharField(max_length=10)
    sexo = serializers.CharField(max_length=1)

    def validate(
        self,
        attrs: ConsultaPersonaExternaDatos,
    ) -> ConsultaPersonaExternaDatos:
        attrs["dni"] = attrs["dni"].strip()
        attrs["sexo"] = attrs["sexo"].strip().upper()
        if not attrs["dni"]:
            raise serializers.ValidationError({"dni": "El DNI es obligatorio."})
        if attrs["sexo"] not in {"M", "F", "X"}:
            raise serializers.ValidationError({"sexo": "El sexo debe ser M, F o X."})
        return attrs


class GeoFeaturesQuerySerializer(serializers.Serializer):
    domicilio = serializers.CharField(max_length=256)

    def validate_domicilio(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("El domicilio es obligatorio.")
        return value


class GeoDireccionQuerySerializer(serializers.Serializer):
    codigoCalle = serializers.IntegerField()
    altura = serializers.IntegerField()
    bis = serializers.BooleanField()
    letra = serializers.CharField(max_length=8, required=False, allow_blank=True)


class GeoCoordenadasQuerySerializer(serializers.Serializer):
    punto_x = serializers.FloatField()
    punto_y = serializers.FloatField()

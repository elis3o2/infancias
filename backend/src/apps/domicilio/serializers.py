from rest_framework import serializers
from .models import Domicilio, DomicilioValidado, TipoInstitucion, Institucion


class DomicilioValidadoSerializer(serializers.ModelSerializer):

    class Meta:
        model = DomicilioValidado
        fields = "__all__"


class DomicilioValidadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DomicilioValidado
        fields = "__all__"


class DomicilioSerializer(serializers.ModelSerializer):
    domicilio_validado = DomicilioValidadoSerializer()

    class Meta:
        model = Domicilio
        fields = "__all__"

    def create(self, validated_data):
        domicilio_validado_data = validated_data.pop("domicilio_validado")

        domicilio_validado, _ = DomicilioValidado.objects.get_or_create(
            codigo_calle=domicilio_validado_data["codigo_calle"],
            altura=domicilio_validado_data["altura"],
            bis=domicilio_validado_data["bis"],
            defaults=domicilio_validado_data,
        )

        return Domicilio.objects.create(
            domicilio_validado=domicilio_validado,
            **validated_data,
        )


class TipoInstitucionSerializer(serializers.ModelSerializer):

    class Meta:
        model = TipoInstitucion
        fields = "__all__"


class InstitucionSerializer(serializers.ModelSerializer):
    tipo = TipoInstitucionSerializer(read_only=True)

    id_tipo = serializers.PrimaryKeyRelatedField(
        queryset=TipoInstitucion.objects.all(),
        source="tipo",
        write_only=True,
    )

    domicilio = DomicilioSerializer()

    class Meta:
        model = Institucion
        fields = "__all__"

    def create(self, validated_data):
        domicilio_data = validated_data.pop("domicilio")

        domicilio = DomicilioSerializer().create(domicilio_data)

        return Institucion.objects.create(
            domicilio=domicilio,
            **validated_data
        )





from rest_framework import serializers
from .models import Provincia, Departamento, Domicilio, DomicilioValidado, TipoInstitucion, Institucion


class ProvinciaSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Provincia
        fields = "__all__"


class DepartamentoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Departamento
        fields = "__all__"

        
class DomicilioValidadoSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = DomicilioValidado
        fields = "__all__"


class DomicilioSerializer(serializers.ModelSerializer):
    departamento = DepartamentoSerializer(read_only=True)

    id_departamento = serializers.PrimaryKeyRelatedField(
        queryset=Departamento.objects.all(),
        source="departamento",
        write_only=True,
        required=True,
    )

    domicilio_validado = DomicilioValidadoSerializer(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Domicilio
        fields = "__all__"

    def create(self, validated_data):
        domicilio_validado_data = validated_data.pop(
            "domicilio_validado",
            None,
        )

        domicilio_validado = None

        if domicilio_validado_data is not None:
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
        required=True,
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
            **validated_data,
        )


class ReferenciaInstitucionInputSerializer(serializers.Serializer):
    id = serializers.PrimaryKeyRelatedField(
        queryset=Institucion.objects.all(),
        required=False,
    )

    nombre = serializers.CharField(
        required=False,
    )

    id_tipo = serializers.PrimaryKeyRelatedField(
        queryset=TipoInstitucion.objects.all(),
        source="tipo",
        required=False,
    )

    domicilio = DomicilioSerializer(
        required=False,
    )

    telefono = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    correo = serializers.EmailField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
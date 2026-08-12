from rest_framework import serializers
from .models import (Adolescente, Solicitante, Familiar, Vinculo, Hermano, AdolescenteValidado, HermanoValidado, AdolescenteInstitucion)
from src.apps.domicilio.models import Institucion
from src.apps.domicilio.serializers import (DomicilioSerializer, InstitucionSerializer, ReferenciaInstitucionInputSerializer)
from django.db import transaction

class HermanoValidadoSerializer(serializers.ModelSerializer):
    
    id_hermano = serializers.PrimaryKeyRelatedField(
        queryset=Hermano.objects.all(),
        source="hermano",
        write_only=True,
    )

    class Meta:
        model = HermanoValidado
        fields = (
            "id",
            "id_hermano",
            "dni",
            "sexo",
            "nombre",
            "apellido",
            "fecha_nacimiento",
        )


class HermanoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Hermano
        fields = "__all__"
        extra_kwargs = {
            "adolescente": {"required": False}
        }


class VinculoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vinculo
        fields = '__all__'


class FamiliarSerializer(serializers.ModelSerializer):
    
    id_vinculo = serializers.PrimaryKeyRelatedField(
        queryset=Vinculo.objects.all(),
        source="vinculo",
        write_only=True,
    )
    
    vinculo = VinculoSerializer(read_only=True)

    class Meta:
        model = Familiar
        fields = "__all__"
        extra_kwargs = {
            "adolescente": {"required": False}
        }


class AdolescenteValidadoSerializer(serializers.ModelSerializer):
    
    id_adolescente = serializers.PrimaryKeyRelatedField(
        queryset=Adolescente.objects.all(),
        source="adolescente",
        write_only=True,
    )
    

    class Meta:
        model = AdolescenteValidado
        fields = (
            "id",
            "id_adolescente",
            "dni",
            "sexo",
            "nombre",
            "apellido",
            "fecha_nacimiento",
        )


class AdolescenteSerializer(serializers.ModelSerializer):
    domicilio = DomicilioSerializer()

    hermanos = HermanoSerializer(
        many=True,
        required=False,
    )

    familiares = FamiliarSerializer(
        many=True,
        required=False,
    )

    adolescente_validado = serializers.SerializerMethodField()
    hermanos_validados = serializers.SerializerMethodField()

    referencias_instituciones = InstitucionSerializer(
        many=True,
        read_only=True,
    )

    referencias_instituciones_data = ReferenciaInstitucionInputSerializer(
        many=True,
        write_only=True,
        required=False,
    )

    class Meta:
        model = Adolescente
        fields = "__all__"

    def get_adolescente_validado(self, obj):
        try:
            validado = AdolescenteValidado.objects.get(
                adolescente=obj
            )

            return AdolescenteValidadoSerializer(validado).data

        except AdolescenteValidado.DoesNotExist:
            return None

    def get_hermanos_validados(self, obj):
        hermanos = HermanoValidado.objects.filter(
            hermano__adolescente=obj
        )

        return HermanoValidadoSerializer(
            hermanos,
            many=True,
        ).data

    @transaction.atomic
    def create(self, validated_data):
        domicilio_data = validated_data.pop("domicilio")

        hermanos_data = validated_data.pop("hermanos", [])

        familiares_data = validated_data.pop("familiares", [])

        referencias_data = validated_data.pop("referencias_instituciones_data", [])

        # Crear domicilio
        domicilio = DomicilioSerializer().create(domicilio_data)

        # Crear adolescente
        adolescente = Adolescente.objects.create(
            domicilio=domicilio,
            **validated_data,
        )

        # Crear hermanos
        for hermano_data in hermanos_data:
            Hermano.objects.create(
                adolescente=adolescente,
                **hermano_data,
            )

        # Crear familiares
        for familiar_data in familiares_data:
            Familiar.objects.create(
                adolescente=adolescente,
                **familiar_data,
            )

        # Crear relaciones con instituciones
        for referencia_data in referencias_data:
            institucion = referencia_data.pop(
                "id",
                None
            )

            # Institución existente
            if institucion is not None:
                # Por ser PrimaryKeyRelatedField,
                # `institucion` ya es una instancia de Institucion.
                pass

            # Institución nueva
            else:
                institucion = InstitucionSerializer().create(
                    referencia_data
                )

            AdolescenteInstitucion.objects.create(
                adolescente=adolescente,
                institucion=institucion,
            )

        return adolescente

class SolicitanteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Solicitante
        fields = '__all__'
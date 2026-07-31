from rest_framework import serializers
from .models import Adolescente, Solicitante, Familiar, Vinculo, Hermano
from src.apps.domicilio.serializers import DomicilioSerializer


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

class AdolescenteSerializer(serializers.ModelSerializer):
    domicilio = DomicilioSerializer()

    hermanos = HermanoSerializer(many=True, required=False)
    familiares = FamiliarSerializer(many=True, required=False)

    class Meta:
        model = Adolescente
        fields = "__all__"

    def create(self, validated_data):
        domicilio_data = validated_data.pop("domicilio")
        
        hermanos = validated_data.pop("hermanos", [])
        print(hermanos)
        familiares = validated_data.pop("familiares", [])

        domicilio = DomicilioSerializer().create(domicilio_data)

        adolescente = Adolescente.objects.create(
            domicilio=domicilio,
            **validated_data,
        )

        for hermano_data in hermanos:
            hermano = AdolescenteSerializer().create(hermano_data)

            Hermano.objects.create(
                adolescente=adolescente,
                hermano=hermano,
            )

        for familiar_data in familiares:
            Familiar.objects.create(
                adolescente=adolescente,
                **familiar_data,
            )

        return adolescente


class SolicitanteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Solicitante
        fields = '__all__'
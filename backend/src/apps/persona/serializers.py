from rest_framework import serializers
from .models import (Adolescente, Solicitante, Familiar, Vinculo, Hermano, AdolescenteValidado, HermanoValidado,
                        AdolescenteGubernamental, AdolescenteNoGubernamental)
from src.apps.domicilio.serializers import (DomicilioSerializer, ReferenciaGubernamentalSerializer, ReferenciaGubernamentalInputSerializer,
                                            ReferenciaNoGubernamentalSerializer, ReferenciaNoGubernamentalInputSerializer)


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

    hermanos = HermanoSerializer(many=True, required=False)
    familiares = FamiliarSerializer(many=True, required=False)

    adolescente_validado = serializers.SerializerMethodField()
    hermanos_validados = serializers.SerializerMethodField()


    referencias_gubernamentales = ReferenciaGubernamentalSerializer(many=True, read_only=True)
    referencias_no_gubernamentales = ReferenciaNoGubernamentalSerializer(many=True, read_only=True)
    
    referencias_gubernamentales_data = ReferenciaGubernamentalInputSerializer(
        many=True,
        write_only=True,
        required=False
    )
    referencias_no_gubernamentales_data = ReferenciaNoGubernamentalInputSerializer(
        many=True,
        write_only=True,
        required=False
    )

    class Meta:
        model = Adolescente
        fields = "__all__"

    def get_adolescente_validado(self, obj):
            try:
                validado = AdolescenteValidado.objects.get(adolescente=obj)
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


    def create(self, validated_data):
        domicilio_data = validated_data.pop("domicilio")
        
        hermanos = validated_data.pop("hermanos", [])
        familiares = validated_data.pop("familiares", [])

        refs_gub = validated_data.pop("referencias_gubernamentales_data", [])
        refs_no_gub = validated_data.pop("referencias_no_gubernamentales_data", [])

        domicilio = DomicilioSerializer().create(domicilio_data)

        adolescente = Adolescente.objects.create(
            domicilio=domicilio,
            **validated_data,
        )
        
        for hermano_data in hermanos:
            Hermano.objects.create(
                adolescente=adolescente,
                **hermano_data
            )

        for familiar_data in familiares:
            Familiar.objects.create(
                adolescente=adolescente,
                **familiar_data,
            )

        for ref_data in refs_gub:
            if "id" in ref_data:
                referencia = ReferenciaGubernamental.objects.get(id=ref_data["id"])
            else:
                referencia = ReferenciaGubernamentalSerializer().create(ref_data)
            AdolescenteGubernamental.objects.create(
                adolescente=adolescente,
                gubernamental=referencia
            )

        for ref_data in refs_no_gub:
            if "id" in ref_data:
                referencia = ReferenciaNoGubernamental.objects.get(id=ref_data["id"])
            else:
                referencia = ReferenciaNoGubernamentalSerializer().create(ref_data)
            AdolescenteNoGubernamental.objects.create(
                adolescente=adolescente,
                gubernamental=referencia
            )

        return adolescente


class SolicitanteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Solicitante
        fields = '__all__'
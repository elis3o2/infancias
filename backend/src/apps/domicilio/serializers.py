from rest_framework import serializers
from .models import (Provincia, Departamento, Distrito, Vecinal, Barrio, SeccionalPolicial, IdentidadBarrial,
                    Domicilio, DomicilioValidado, TipoInstitucion, Institucion)


class ProvinciaSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Provincia
        fields = "__all__"


class DepartamentoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Departamento
        fields = "__all__"


class DistritoSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Distrito
        fields = "__all__"


class VecinalSeializer(serializers.ModelSerializer):
    
    class Meta:
        model = Vecinal
        fields = "__all__"


class BarrioSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Barrio
        fields = "__all__"


class SeccionalPolicialSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = SeccionalPolicial
        fields = "__all__"


class IdentidadBarrialSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = IdentidadBarrial
        fields = "__all__"


class DomicilioValidadoSerializer(serializers.ModelSerializer):
    codigoCalle = serializers.IntegerField(source="codigo_calle")
    distrito    = DistritoSerializer(read_only=True)
    vecinal     = VecinalSeializer(read_only=True)
    barrio      = BarrioSerializer(read_only=True)
    seccional_policial = SeccionalPolicialSerializer(read_only=True)
    identidad_barrial  = IdentidadBarrialSerializer(read_only=True)
    puntoX = serializers.FloatField(read_only=True)
    puntoY = serializers.FloatField(read_only=True)
    fraccion_censal = serializers.IntegerField(read_only=True)
    radio_censal    = serializers.IntegerField(read_only=True)

    class Meta:
        model = DomicilioValidado
        fields = "__all__"


class DomicilioSerializer(serializers.ModelSerializer):
    departamento    = DepartamentoSerializer(read_only=True)
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


class ReferenciaInstitucionInputSerializer(serializers.Serializer):
    # Identifica una referencia nueva que se reutiliza dentro de una misma
    # solicitud. No se persiste: la asociación siempre es adolescente ↔
    # institución.
    id_temp = serializers.CharField(
        max_length=64,
        required=False,
        allow_blank=False,
    )
    id = serializers.PrimaryKeyRelatedField(
        queryset=Institucion.objects.all(),
        required=False,
    )
    nombre  = serializers.CharField(required=False,)
    id_tipo = serializers.PrimaryKeyRelatedField(
        queryset=TipoInstitucion.objects.all(),
        source="tipo",
        required=False,
    )
    domicilio = DomicilioSerializer(required=False,)

    def validate(self, attrs):
        institucion_existente = attrs.get("id")
        if institucion_existente is not None:
            return attrs

        faltantes = [
            campo
            for campo in ("nombre", "tipo", "domicilio")
            if campo not in attrs
        ]
        if faltantes:
            raise serializers.ValidationError(
                {
                    campo: "Este campo es obligatorio para una institución nueva."
                    for campo in faltantes
                }
            )

        return attrs

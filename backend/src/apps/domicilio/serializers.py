from rest_framework import serializers
from .models import (Provincia, Departamento, Distrito, Vecinal, Barrio, SeccionalPolicial, IdentidadBarrial, Localidad,
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


class LocalidadSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Localidad
        fields = "__all__"


        
class DomicilioValidadoSerializer(serializers.ModelSerializer):
    distrito = DistritoSerializer()
    vecinal  = VecinalSeializer()
    barrio   = BarrioSerializer()
    seccional_policial = SeccionalPolicialSerializer()
    identidad_barrial = IdentidadBarrialSerializer()
    localidad = LocalidadSerializer()

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
    id = serializers.PrimaryKeyRelatedField(
        queryset=Institucion.objects.all(),
        required=False,
    )
    nombre = serializers.CharField(required=False,)
    id_tipo = serializers.PrimaryKeyRelatedField(
        queryset=TipoInstitucion.objects.all(),
        source="tipo",
        required=False,
    )
    domicilio = DomicilioSerializer(required=False,)
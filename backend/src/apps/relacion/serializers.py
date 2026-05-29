from rest_framework import serializers
from .models import Instruccion, Ocupacion, TipoRelacion, Relacion
from src.apps.persona.serializers import MenorSerializer, PersonaSerializer
from src.apps.persona.models import Persona, Menor

class InstruccionSerializer(serializers.ModelSerializer):
    
    class Meta:
        model  = Instruccion
        fields = ['id', 'nombre']


class OcupacionSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Ocupacion
        fields = ['id', 'nombre']


class TipoRelacionSerializer(serializers.ModelSerializer):

    class Meta:
        model  = TipoRelacion
        fields = ['id', 'nombre']


class RelacionSerializer(serializers.ModelSerializer):
    menor = MenorSerializer(read_only=True)
    familiar = PersonaSerializer(read_only=True)
    tipo = TipoRelacionSerializer(read_only=True)
    instruccion = InstruccionSerializer(read_only=True)
    ocupacion = OcupacionSerializer(read_only=True)

    id_menor = serializers.PrimaryKeyRelatedField(source='menor', queryset=Menor.objects.all(), write_only=True)
    id_familiar = serializers.PrimaryKeyRelatedField(source='familiar', queryset=Persona.objects.all(), write_only=True)
    id_tipo = serializers.PrimaryKeyRelatedField(source='tipo', queryset=TipoRelacion.objects.all(), write_only=True)
    id_instruccion = serializers.PrimaryKeyRelatedField(source='instruccion', queryset=Instruccion.objects.all(), write_only=True)
    id_ocupacion = serializers.PrimaryKeyRelatedField(source='ocupacion', queryset=Ocupacion.objects.all(), write_only=True)

    class Meta:
        model  = Relacion
        fields = ['id', 'menor', 'familiar','convive', 'tipo', 'instruccion', 'ocupacion',
        'id_menor', 'id_familiar', 'id_tipo', 'id_instruccion', 'id_ocupacion']
    


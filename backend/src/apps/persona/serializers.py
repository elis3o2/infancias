from rest_framework import serializers
from .models import Persona, Escolaridad, ObraSocial, Menor, CCB
from src.apps.domicilio.serializers import DomicilioSerializer, EfectorSerializer

class PersonaSerializer(serializers.ModelSerializer):
    domicilio = DomicilioSerializer(read_only=True)
    
    class Meta:
        models = Persona
        fields = ['id', 'nombre']


class EscolaridadSerializer(serializers.ModelSerializer):

    class Meta:
        models = Escolaridad
        fields = ['id', 'nombre']


class ObraSocialSerializer(serializers.ModelSerializer):

    class Meta:
        models = ObraSocial
        fields = ['id', 'nombre']


class CCBSerializer(serializers.ModelSerializer):
    
    class Meta:
        models = CCB 
        fields = ['id', 'nombre']


class MenorSerializer(serializers.ModelSerializer):
    persona = PersonaSerializer(read_only=True)
    escolaridad = EscolaridadSerializer(read_only=True)
    efector_ref = EfectorSerializer(read_only=True)
    ccb_ref = CCBSerializer(read_only=True)
    obra_social = ObraSocialSerializer(read_only=True)
    
    class Meta:
        models = Menor
        fields = ['id', 'nombre']


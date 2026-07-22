from rest_framework import serializers
from .models import Adolescente, Solicitante, Familiar, Vinculo, Hermano
from src.apps.domicilio.serializers import DomicilioSerializer

class AdolescenteSerializer(serializers.ModelSerializer):
    domicilio = DomicilioSerializer(read_only=True)
    
    class Meta:
        models = Adolescente
        fields = '__all__'


class SolicitanteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Solicitante
        fields = '__all__'


class HermanoSerializer(serializers.ModelSerializer):
    adolescente = AdolescenteSerializer(read_only=True)
    hermano = AdolescenteSerializer(read_only=True)

    class Meta:
        model = Hermano 
        fields = '__all__'


class VinculoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vinculo
        fields = '__all__'


class FamiliarSerializer(serializers.ModelSerializer):

    class Meta:
        model = Familiar
        fields = '__all__'
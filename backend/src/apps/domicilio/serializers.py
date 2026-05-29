from rest_framework import serializers
from .models import Domicilio, TipoEfector, Efector, Institucion

class DomicilioSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Domicilio
        fields = "__all__"


class TipoEfectorSerializer(serializers.ModelSerializer):

    class Meta:
        model = TipoEfector
        fields = ['id', 'nombre']


class EfectorSerializer(serializers.ModelSerializer):

    class Meta:
        model = Efector
        fields = ['id', 'nombre']

class InstitucionSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Institucion
        fields = ['id', 'nombre']







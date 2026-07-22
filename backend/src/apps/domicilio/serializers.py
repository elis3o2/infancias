from rest_framework import serializers
from .models import Domicilio, TipoInstitucion, Institucion

class DomicilioSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Domicilio
        fields = "__all__"


class TipoInstitucionSerializer(serializers.ModelSerializer):

    class Meta:
        model = TipoInstitucion
        fields = ['id', 'nombre']


class InstitucionSerializer(serializers.ModelSerializer):
    tipo = TipoInstitucionSerializer(read_only=True)

    class Meta:
        model = Institucion
        fields = ['id', 'nombre', 'tipo']







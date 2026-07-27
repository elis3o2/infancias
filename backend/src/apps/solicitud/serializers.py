from rest_framework import serializers
from .models import MotivoSolicitud, PrioridadSolicitud, Solicitud, Archivo
from src.apps.persona.serializers import AdolescenteSerializer, SolicitanteSerializer
from src.apps.domicilio.serializers import InstitucionSerializer

class MotivoSolicitudSerializer(serializers.ModelSerializer):

    class Meta:
        model = MotivoSolicitud
        fields = '__all__'

class PrioridadSolicitudSerializer(serializers.ModelSerializer):

    class Meta:
        model = PrioridadSolicitud
        fields = '__all__'


class SolicitudSerializer(serializers.ModelSerializer):
    adolescente = AdolescenteSerializer()
    solicitante = SolicitanteSerializer()
    institucion = InstitucionSerializer()
    motivo      = MotivoSolicitudSerializer()
    prioridad   = PrioridadSolicitudSerializer()

    class Meta:
        model = Solicitud
        fields = '__all__'

class ArchivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Archivo
        fields = [
            "id",
            "id_solicitud",
            "nombre",
            "tipo_mime",
            "contenido",
        ]
        read_only_fields = [
            "contenido",
        ]
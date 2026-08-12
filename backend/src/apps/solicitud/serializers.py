from rest_framework import serializers
from django.utils import timezone
from .models import MotivoSolicitud, PrioridadSolicitud, Solicitud, Archivo, Derivacion
from src.apps.persona.serializers import AdolescenteSerializer, SolicitanteSerializer
from src.apps.domicilio.serializers import InstitucionSerializer
from src.apps.domicilio.models import Institucion

class MotivoSolicitudSerializer(serializers.ModelSerializer):

    class Meta:
        model = MotivoSolicitud
        fields = '__all__'

class PrioridadSolicitudSerializer(serializers.ModelSerializer):

    class Meta:
        model = PrioridadSolicitud
        fields = '__all__'


class ArchivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Archivo
        fields = ("id", "nombre", "tipo_mime")


class DerivacionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Derivacion
        fields = '__all__'


class SolicitudListSerializer(serializers.ModelSerializer):
    motivo      = MotivoSolicitudSerializer(read_only=True)
    prioridad   = PrioridadSolicitudSerializer(read_only=True)
    derivacion  = DerivacionSerializer(read_only=True)
    fecha_hora_creacion = serializers.DateTimeField(read_only=True)
    fecha_hora_modificacion = serializers.DateTimeField(read_only=True)
    validado = serializers.BooleanField(read_only=True)
    rechazado = serializers.BooleanField(read_only=True)

    class Meta:
        model = Solicitud
        fields = ['id', 'motivo', 'prioridad', 'derivacion', 'fecha_hora_creacion', 'fecha_hora_modificacion',
                    'validado', 'rechazado']

class SolicitudSerializer(serializers.ModelSerializer):
    adolescente = AdolescenteSerializer()
    solicitante = SolicitanteSerializer()
    institucion = InstitucionSerializer(required=False)

    motivo      = MotivoSolicitudSerializer(read_only=True)
    prioridad   = PrioridadSolicitudSerializer(read_only=True)
    derivacion  = DerivacionSerializer(read_only=True)

    id_institucion = serializers.PrimaryKeyRelatedField(
        queryset=Institucion.objects.all(),
        source="institucion",
        write_only=True,
        required=False
    )

    id_motivo = serializers.PrimaryKeyRelatedField(
        queryset=MotivoSolicitud.objects.all(),
        source="motivo",
        write_only=True,
    )

    id_prioridad = serializers.PrimaryKeyRelatedField(
        queryset=PrioridadSolicitud.objects.all(),
        source="prioridad",
        write_only=True,
    )

    fecha_hora_creacion = serializers.DateTimeField(read_only=True)
    fecha_hora_modificacion = serializers.DateTimeField(read_only=True)
    validado = serializers.BooleanField(read_only=True)
    rechazado = serializers.BooleanField(read_only=True)

    archivos = ArchivoSerializer(many=True, read_only=True, source="archivo_set")

    def create(self, validated_data):
        print("SOLICITUD VALIDATED:")
        print(validated_data)
        adolescente_data = validated_data.pop("adolescente")
        solicitante_data = validated_data.pop("solicitante")
        

        institucion_data = validated_data.pop("institucion", None)

        if isinstance(institucion_data, dict):
            validated_data["institucion"] = InstitucionSerializer().create(institucion_data)

        elif isinstance(institucion_data, Institucion):
            validated_data["institucion"] = institucion_data

        adolescente = AdolescenteSerializer().create(adolescente_data)
        solicitante = SolicitanteSerializer().create(solicitante_data)

        validated_data["adolescente"] = adolescente
        validated_data["solicitante"] = solicitante

        validated_data["fecha_hora_creacion"] = timezone.now()
        validated_data["validado"] = False
        validated_data["rechazado"] = False

        return Solicitud.objects.create(**validated_data)


    class Meta:
        model = Solicitud
        fields = '__all__'


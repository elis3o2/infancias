from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from .models import MotivoSolicitud, PrioridadSolicitud, Solicitud, Archivo
from src.apps.persona.serializers import ( AdolescenteCreateSerializer, AdolescenteReadSerializer, AdolescenteWriteSerializer,
                                            AdolescenteValReadSerializer)
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




class SolicitudListSerializer(serializers.ModelSerializer):
    motivo = MotivoSolicitudSerializer(read_only=True)
    prioridad = serializers.SerializerMethodField()
    validado = serializers.BooleanField(read_only=True)
    rechazado = serializers.BooleanField(read_only=True)

    class Meta:
        model = Solicitud
        fields = [
            'id',
            'motivo',
            'prioridad',
            'fecha_hora_creacion',
            'fecha_hora_entrada',
            'validado',
            'rechazado',
        ]

    def get_prioridad(self, obj):
        if obj.validado and obj.prioridad_extra is not None:
            return PrioridadSolicitudSerializer(
                obj.prioridad_extra
            ).data

        return PrioridadSolicitudSerializer(
            obj.prioridad
        ).data


class SolicitudCreateSerializer(serializers.ModelSerializer):
    adolescente    = AdolescenteCreateSerializer()
    institucion    = InstitucionSerializer(required=False)
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

    class Meta:
        model = Solicitud
        fields = [
            "adolescente",
            "institucion",
            "id_institucion",
            "id_motivo",
            "id_prioridad",
            "correo",
            "telefono",
            "descripcion"
        ]



class SolicitudReadSerializer(serializers.ModelSerializer):
    adolescente = AdolescenteReadSerializer(read_only=True)
    institucion = InstitucionSerializer(read_only=True)
    motivo      = MotivoSolicitudSerializer(read_only=True)
    prioridad   = PrioridadSolicitudSerializer(read_only=True)
    archivos    = ArchivoSerializer(many=True, read_only=True, source="archivo_set")

    class Meta:
        model = Solicitud
        fields = [
            "id",
            "institucion",
            "adolescente",
            "motivo",
            "correo",
            "telefono",
            "prioridad",
            "descripcion",
            "fecha_hora_creacion",
            "archivos",
            "validado",
            "rechazado",
            "motivo_rechazo"
        ]


class SolicitudValReadSerializer(serializers.ModelSerializer):
    adolescente = AdolescenteValReadSerializer(read_only=True)
    institucion = InstitucionSerializer(read_only=True)
    motivo      = MotivoSolicitudSerializer(read_only=True)
    prioridad   = PrioridadSolicitudSerializer(read_only=True, source="prioridad_extra")
    archivos    = serializers.SerializerMethodField()

    class Meta:
        model = Solicitud
        fields =  [
            "id",
            "institucion",
            "adolescente",
            "motivo",
            "correo",
            "telefono",
            "prioridad",
            "descripcion",
            "descripcion_extra",
            "fecha_hora_creacion",
            "fecha_hora_entrada",
            "archivos",
            "validado",
            "rechazado",
            "motivo_rechazo"
        ]

    def get_archivos(self, obj):
        archivos = Archivo.objects.filter(
            solicitud=obj,
            valido=True
        )

        return ArchivoSerializer(
            archivos,
            many=True
        ).data



class SolicitudWriteSerializer(serializers.ModelSerializer):

    adolescente = AdolescenteWriteSerializer(required=True)
    descripcion_extra = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    id_prioridad = serializers.PrimaryKeyRelatedField(
        queryset=PrioridadSolicitud.objects.all(),
        source="prioridad_extra",
        write_only=True,
    )
    

    class Meta:
        model = Solicitud
        fields = [
            "id",
            "descripcion_extra",
            "id_prioridad",
            "adolescente",
        ]




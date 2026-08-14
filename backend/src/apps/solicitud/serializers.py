from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from .models import MotivoSolicitud, PrioridadSolicitud, Solicitud, Archivo, Derivacion
from src.apps.persona.serializers import ( AdolescenteCreateSerializer, AdolescenteReadSerializer, AdolescenteWriteSerializer,
                                            AdolescenteValReadSerializer, SolicitanteSerializer)
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
    motivo     = MotivoSolicitudSerializer(read_only=True)
    prioridad  = PrioridadSolicitudSerializer(read_only=True)
    derivacion = DerivacionSerializer(read_only=True)
    validado   = serializers.BooleanField(read_only=True)
    rechazado  = serializers.BooleanField(read_only=True)

    class Meta:
        model = Solicitud
        fields = ['id', 'motivo', 'prioridad', 'derivacion', 'fecha_hora_creacion', 'fecha_hora_modificacion',
                    'validado', 'rechazado']



class SolicitudCreateSerializer(serializers.ModelSerializer):
    adolescente    = AdolescenteCreateSerializer()
    solicitante    = SolicitanteSerializer()
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

    def create(self, validated_data):
        adolescente_data = validated_data.pop("adolescente")
        solicitante_data = validated_data.pop("solicitante")

        institucion_data = validated_data.pop("institucion", None)
        
        if isinstance(institucion_data, dict):
            validated_data["institucion"] = InstitucionSerializer().create(institucion_data)
        
        elif isinstance(institucion_data, Institucion):
            validated_data["institucion"] = institucion_data

        adolescente = AdolescenteCreateSerializer().create(adolescente_data)
        solicitante = SolicitanteSerializer().create(solicitante_data)

        validated_data["adolescente"] = adolescente
        validated_data["solicitante"] = solicitante

        validated_data["fecha_hora_creacion"] = timezone.now()
        validated_data["validado"] = False
        validated_data["rechazado"] = False

        return Solicitud.objects.create(**validated_data)

    class Meta:
        model = Solicitud
        fields = [
            "adolescente",
            "solicitante",
            "institucion",
            "id_institucion",
            "id_motivo",
            "id_prioridad",
            "correo",
            "telefono"
        ]


class SolicitudReadSerializer(serializers.ModelSerializer):
    adolescente = AdolescenteReadSerializer(read_only=True)
    solicitante = SolicitanteSerializer(read_only=True)
    institucion = InstitucionSerializer(read_only=True)
    motivo      = MotivoSolicitudSerializer(read_only=True)
    prioridad   = PrioridadSolicitudSerializer(read_only=True)
    archivos    = ArchivoSerializer(many=True, read_only=True, source="archivo_set")

    class Meta:
        model = Solicitud
        fields = [
            "id",
            "institucion",
            "solicitante",
            "adolescente",
            "motivo",
            "correo",
            "telefono",
            "prioridad",
            "descripcion",
            "fecha_hora_creacion",
            "archivos"
        ]


class SolicitudValReadSerializer(serializers.ModelSerializer):
    adolescente = AdolescenteValReadSerializer(read_only=True)
    solicitante = SolicitanteSerializer(read_only=True)
    institucion = InstitucionSerializer(read_only=True)
    motivo      = MotivoSolicitudSerializer(read_only=True)
    prioridad   = PrioridadSolicitudSerializer(read_only=True, source="prioridad_extra")
    archivos    = serializers.SerializerMethodField()

    class Meta:
        model = Solicitud
        fields =  [
            "id",
            "institucion",
            "solicitante",
            "adolescente",
            "motivo",
            "correo",
            "telefono",
            "prioridad",
            "descripcion",
            "descripcion_extra",
            "fecha_hora_creacion",
            "fecha_hora_modificacion",
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

    id_archivos = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
    )
    
    id_derivacion = serializers.PrimaryKeyRelatedField(
        queryset=Derivacion.objects.all(),
        source="derivacion",
        write_only=True,
        required=True,
    )

    class Meta:
        model = Solicitud
        fields = [
            "id",
            "descripcion_extra",
            "id_prioridad",
            "id_derivacion",
            "adolescente",
        ]

    @transaction.atomic
    def update(self, instance, validated_data):

        adolescente_data = validated_data.pop("adolescente", None)
        archivos_data = validated_data.pop("id_archivos", None)

        # Actualizar Solicitud
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        # Actualizar Adolescente
        if adolescente_data:

            adolescente_serializer = AdolescenteWriteSerializer(
                instance=instance.adolescente,
                data=adolescente_data,
                partial=True,
            )

            adolescente_serializer.is_valid(
                raise_exception=True
            )

            adolescente_serializer.save()

        if id_archivos: 

            Archivo.objects.filter(
                id__in=id_archivos,
                solicitud=instance,
            ).update(
                valido=True
            ) 
        return instance
    



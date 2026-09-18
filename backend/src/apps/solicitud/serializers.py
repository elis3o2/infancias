from rest_framework import serializers
from .models import MotivoSolicitud, Solicitud, Archivo, SolicitudComentario, SolicitudInstitucion
from src.serializers import EquipoSerializer
from src.apps.persona.serializers import (AdolescenteCreateSerializer, AdolescenteReadSerializer, AdolescenteWriteSerializer,
                                            AdolescenteValReadSerializer, FamiliarSerializer, PersonaSerializer)
from src.apps.domicilio.serializers import InstitucionSerializer, ReferenciaInstitucionInputSerializer
from src.apps.domicilio.models import Institucion

class MotivoSolicitudSerializer(serializers.ModelSerializer):

    class Meta:
        model = MotivoSolicitud
        fields = '__all__'


class ArchivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Archivo
        fields = ("id", "nombre", "tipo_mime")



class SolicitudInstitucionSerializer(serializers.ModelSerializer):
    institucion = InstitucionSerializer(read_only=True)

    class Meta:
        model = SolicitudInstitucion
        fields = ["institucion"]



class SolicitudComentarioSerializer(serializers.ModelSerializer):

    class Meta:
        model = SolicitudComentario
        fields = [
            "id",
            "comentario",
            "fecha_hora_creacion",
            "fecha_hora_ultmod",
            "usuario",
        ]

class SolicitudListSerializer(serializers.ModelSerializer):
    motivo = MotivoSolicitudSerializer(read_only=True)
    equipo = EquipoSerializer(read_only=True)
    validado = serializers.BooleanField(read_only=True)
    rechazado = serializers.BooleanField(read_only=True)

    class Meta:
        model = Solicitud
        fields = [
            'id',
            'motivo',
            'fecha_hora_creacion',
            'fecha_hora_entrada',
            'validado',
            'rechazado',
            'equipo',
        ]




class SolicitudCreateSerializer(serializers.ModelSerializer):

    adolescentes = AdolescenteCreateSerializer(many=True)
    familiares = FamiliarSerializer(many=True, required=False)
    institucion = InstitucionSerializer(required=False, allow_null=True)
    referencias_instituciones_data = ReferenciaInstitucionInputSerializer(many=True, required=False)
    id_institucion = serializers.PrimaryKeyRelatedField(
        queryset=Institucion.objects.all(),
        source="institucion",
        write_only=True,
        required=False,
        allow_null=True
    )
    id_motivo = serializers.PrimaryKeyRelatedField(
        queryset=MotivoSolicitud.objects.all(),
        source="motivo",
        write_only=True
    )

    class Meta:
        model = Solicitud
        fields = [
            "adolescentes",
            "familiares",
            "institucion",
            "referencias_instituciones_data",
            "id_institucion",
            "id_motivo",
            "correo",
            "telefono",
            "descripcion",
        ]

    def validate_adolescentes(self, value):
        if not value:
            raise serializers.ValidationError(
                "Debe existir al menos un adolescente."
            )

        return value

    def validate(self, attrs):
        if attrs.get("institucion") is None:
            raise serializers.ValidationError({
                "institucion": "Debe indicar una institución de origen."
            })
        return attrs


class SolicitudReadSerializer(serializers.ModelSerializer):
    adolescentes = AdolescenteReadSerializer(many=True, read_only=True)
    familiares = FamiliarSerializer(many=True, read_only=True)
    familiares_validados = serializers.SerializerMethodField()
    referencias_instituciones = serializers.SerializerMethodField()
    institucion = InstitucionSerializer(read_only=True)
    motivo = MotivoSolicitudSerializer(read_only=True)
    archivos = ArchivoSerializer(
        many=True,
        read_only=True,
    )
    equipo = EquipoSerializer(read_only=True)

    class Meta:
        model = Solicitud
        fields = [
            "id",
            "institucion",
            "adolescentes",
            "familiares",
            "familiares_validados",
            "referencias_instituciones",
            "motivo",
            "correo",
            "telefono",
            "descripcion",
            "descripcion_extra",
            "fecha_hora_creacion",
            "fecha_hora_entrada",
            "fecha_hora_admision",
            "archivos",
            "validado",
            "rechazado",
            "motivo_rechazo",
            "equipo",
        ]

    def get_referencias_instituciones(self, obj):
        referencias = obj.referencias_instituciones.select_related(
            "institucion__tipo",
            "institucion__domicilio__departamento",
        )
        return InstitucionSerializer(
            [referencia.institucion for referencia in referencias],
            many=True,
        ).data

    def get_familiares_validados(self, obj):
        familiares = obj.familiares.filter(persona__isnull=False).select_related(
            "persona__legajo__carpeta"
        ).order_by("id")
        return PersonaSerializer(
            [familiar.persona for familiar in familiares],
            many=True,
        ).data


class SolicitudValReadSerializer(SolicitudReadSerializer):
    """Detalle de solicitudes procesadas con su historial de comentarios."""

    adolescentes = AdolescenteValReadSerializer(many=True, read_only=True)
    comentarios = SolicitudComentarioSerializer(
        source="comentarios",
        many=True,
        read_only=True,
    )

    class Meta(SolicitudReadSerializer.Meta):
        fields = [*SolicitudReadSerializer.Meta.fields, "comentarios"]


class SolicitudWriteSerializer(serializers.Serializer):
    """Decisiones de validación para todos los adolescentes de una solicitud."""

    adolescentes = AdolescenteWriteSerializer(many=True)
    descripcion_extra = serializers.CharField(
        max_length=256,
        required=False,
        allow_blank=True,
    )

    def validate_adolescentes(self, value):
        if not value:
            raise serializers.ValidationError(
                "Debe validar al menos un adolescente."
            )
        return value

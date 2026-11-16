from rest_framework import serializers
from .models import MotivoSolicitud, Solicitud, Archivo, SolicitudComentario
from src.serializers import EquipoSerializer
from src.apps.persona.serializers import (
    LegajoInputSerializer, PersonaValidateSerializer,
    VINCULOS_ENTRE_ADOLESCENTES, VINCULOS_FAMILIARES,
    AdolescenteCreateSerializer,
    AdolescenteReadSerializer,
    AdolescenteValReadSerializer,
    AdolescenteValidateSerializer,
    FamiliarSerializer,
    PersonaSerializer,
    RelacionAdolescenteCreateSerializer,
    RelacionAdolescenteSerializer,
)
from src.apps.domicilio.models import Institucion
from src.apps.domicilio.serializers import DomicilioSerializer, InstitucionSerializer
from .services import (
    familiares_validados_solicitud, legajos_solicitud, puede_agregar_familiares,
    puede_comentar_solicitud, puede_editar_comentario, puede_gestionar_admision,
    relaciones_solicitud, titulo_solicitud, validar_relaciones_formulario,
)


class MotivoSolicitudSerializer(serializers.ModelSerializer):

    class Meta:
        model = MotivoSolicitud
        fields = '__all__'


class ArchivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Archivo
        fields = ("id", "nombre", "tipo_mime")



class SolicitudComentarioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source="usuario.username", read_only=True)
    puede_editar = serializers.SerializerMethodField()

    class Meta:
        model = SolicitudComentario
        fields = [
            "id",
            "comentario",
            "fecha_hora_creacion",
            "fecha_hora_ultmod",
            "usuario",
            "usuario_nombre",
            "puede_editar",
        ]
        read_only_fields = ["id", "fecha_hora_creacion", "fecha_hora_ultmod", "usuario"]

    def get_puede_editar(self, obj):
        request = self.context.get("request")
        return puede_editar_comentario(obj, request.user if request else None)


class SolicitudListSerializer(serializers.ModelSerializer):
    titulo = serializers.SerializerMethodField()
    legajos = serializers.SerializerMethodField()
    motivo = MotivoSolicitudSerializer(read_only=True)
    equipo = EquipoSerializer(read_only=True)
    validado = serializers.BooleanField(read_only=True)
    rechazado = serializers.BooleanField(read_only=True)

    def get_legajos(self, solicitud):
        return legajos_solicitud(solicitud)

    def get_titulo(self, solicitud):
        return titulo_solicitud(solicitud)

    class Meta:
        model = Solicitud
        fields = [
            'id',
            'titulo',
            'legajos',
            'motivo',
            'fecha_hora_creacion',
            'fecha_hora_entrada',
            'validado',
            'rechazado',
            'equipo',
        ]


class SolicitudCreateSerializer(serializers.ModelSerializer):

    adolescentes = AdolescenteCreateSerializer(many=True)
    relaciones_adolescentes = RelacionAdolescenteCreateSerializer(many=True, required=False)
    id_motivo = serializers.PrimaryKeyRelatedField(
        queryset=MotivoSolicitud.objects.all(),
        source="motivo",
        write_only=True,
    )
    institucion    = InstitucionSerializer(required=False)
    id_institucion = serializers.PrimaryKeyRelatedField(
        queryset=Institucion.objects.all(),
        source="institucion",
        write_only=True,
        required=False
    )


    class Meta:
        model = Solicitud
        fields = [
            "adolescentes",
            "relaciones_adolescentes",
            "institucion",
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
        if not any(adolescente.get("familiares") for adolescente in value):
            raise serializers.ValidationError(
                "Debe cargar al menos un familiar en la solicitud."
            )
        return value

    def validate(self, attrs):
        campos_anteriores = {"familiares", "referencias_instituciones_data"} & self.initial_data.keys()
        if campos_anteriores:
            raise serializers.ValidationError({
                campo: "Este campo debe enviarse dentro del adolescente, no de la solicitud."
                for campo in sorted(campos_anteriores)
            })
        if "institucion" in self.initial_data and "id_institucion" in self.initial_data:
            raise serializers.ValidationError({
                "institucion": "Envíe institucion o id_institucion, no ambos."
            })
        if attrs.get("institucion") is None:
            raise serializers.ValidationError({
                "institucion": "La institución solicitante es obligatoria."
            })

        validar_relaciones_formulario(attrs)
        return attrs


class SolicitudReadSerializer(serializers.ModelSerializer):
    comentarios = SolicitudComentarioSerializer(many=True, read_only=True)
    puede_comentar = serializers.SerializerMethodField()
    adolescentes = AdolescenteReadSerializer(many=True, read_only=True)
    familiares = FamiliarSerializer(many=True, read_only=True)
    familiares_validados = serializers.SerializerMethodField()
    relaciones_adolescentes = serializers.SerializerMethodField()
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
            "relaciones_adolescentes",
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
            "comentarios",
            "puede_comentar",
        ]

    def get_puede_comentar(self, obj):
        request = self.context.get("request")
        return puede_comentar_solicitud(obj, request.user if request else None)

    def get_relaciones_adolescentes(self, obj):
        return RelacionAdolescenteSerializer(relaciones_solicitud(obj), many=True).data

    def get_familiares_validados(self, obj):
        return PersonaSerializer(familiares_validados_solicitud(obj), many=True).data


class SolicitudValReadSerializer(SolicitudReadSerializer):
    """Detalle de solicitudes procesadas con su historial de comentarios."""

    adolescentes = AdolescenteValReadSerializer(many=True, read_only=True)
    puede_agregar_personas = serializers.SerializerMethodField()
    puede_agregar_familiares = serializers.SerializerMethodField()

    class Meta(SolicitudReadSerializer.Meta):
        fields = [*SolicitudReadSerializer.Meta.fields, "puede_agregar_personas", "puede_agregar_familiares"]

    def get_puede_agregar_personas(self, obj):
        request = self.context.get("request")
        return puede_gestionar_admision(obj, request.user if request else None)

    def get_puede_agregar_familiares(self, obj):
        request = self.context.get("request")
        return puede_agregar_familiares(obj, request.user if request else None)


class SolicitudValidateSerializer(serializers.Serializer):
    """Decisiones de validación para todos los adolescentes de una solicitud."""

    adolescentes = AdolescenteValidateSerializer(many=True)
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
        ids = [adolescente["id"] for adolescente in value]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("No puede validar dos veces al mismo adolescente.")
        return value


class FamiliarAdmisionSerializer(serializers.Serializer):
    id_adolescente = serializers.IntegerField(min_value=1)
    persona = PersonaValidateSerializer()
    id_vinculo = serializers.PrimaryKeyRelatedField(
        queryset=VINCULOS_FAMILIARES, source="vinculo",
    )
    telefono = serializers.CharField(
        max_length=16, required=False, allow_blank=True, allow_null=True,
    )
    domicilio = DomicilioSerializer(required=False, allow_null=True)


class AdolescenteAdmisionSerializer(FamiliarAdmisionSerializer):
    id_vinculo = serializers.PrimaryKeyRelatedField(
        queryset=VINCULOS_ENTRE_ADOLESCENTES, source="vinculo",
    )
    domicilio = DomicilioSerializer()
    legajo = LegajoInputSerializer(required=False, allow_null=True)


class FiltrosReporteSerializer(serializers.Serializer):
    periodo = serializers.ChoiceField(choices=["semana", "mes", "todo", "personalizado"], default="semana")
    desde = serializers.DateField(required=False)
    hasta = serializers.DateField(required=False)
    equipo = serializers.RegexField(r"^(?:[1-9][0-9]*|rechazadas)$", required=False, max_length=10)
    solicitud = serializers.IntegerField(required=False, min_value=1, max_value=2147483647)
    estado = serializers.ChoiceField(choices=["pendiente", "validada", "rechazada"], required=False)

    def validate_equipo(self, valor):
        if valor != "rechazadas" and int(valor) > 2147483647:
            raise serializers.ValidationError("El equipo no es válido.")
        return valor

    def validate(self, attrs):
        if attrs["periodo"] == "personalizado":
            if not attrs.get("desde") or not attrs.get("hasta"):
                raise serializers.ValidationError("Indique las fechas desde y hasta.")
            if attrs["desde"] > attrs["hasta"]:
                raise serializers.ValidationError("La fecha desde no puede ser posterior a hasta.")
            if attrs["hasta"].year >= 9999:
                raise serializers.ValidationError("La fecha hasta está fuera del rango permitido.")
        elif "desde" in attrs or "hasta" in attrs:
            raise serializers.ValidationError("Las fechas se usan únicamente con el período personalizado.")
        return attrs


class SolicitudReporteSerializer(serializers.ModelSerializer):
    legajos = serializers.SerializerMethodField()
    equipo = serializers.SerializerMethodField()
    motivo = serializers.CharField(source="motivo.nombre", read_only=True)
    cantidad_adolescentes = serializers.IntegerField(read_only=True)
    cantidad_comentarios = serializers.IntegerField(read_only=True)

    def get_legajos(self, solicitud):
        return legajos_solicitud(solicitud)

    def get_equipo(self, solicitud):
        return "Rechazadas" if solicitud.rechazado else solicitud.equipo.nombre

    class Meta:
        model = Solicitud
        fields = [
            "id", "equipo", "motivo", "fecha_hora_creacion", "validado", "rechazado",
            "cantidad_adolescentes", "cantidad_comentarios", "legajos",
        ]



class SolicitudRechazarSerializer(serializers.Serializer):
    motivo = serializers.CharField(max_length=256, error_messages={
        "required": "El motivo es requerido.", "blank": "El motivo es requerido.",
    })


class SolicitudDerivarSerializer(serializers.Serializer):
    equipo_id = serializers.IntegerField(min_value=1, max_value=2147483647, error_messages={
        "required": "El ID del equipo es requerido para derivar.",
    })


class FiltrosSolicitudesSerializer(serializers.Serializer):
    desde = serializers.DateField(required=False)
    hasta = serializers.DateField(required=False)

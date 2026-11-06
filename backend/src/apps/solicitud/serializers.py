from collections.abc import Mapping

from rest_framework import serializers
from .models import MotivoSolicitud, Solicitud, Archivo, SolicitudComentario
from src.serializers import EquipoSerializer
from src.apps.persona.serializers import (
    AdolescenteCreateSerializer,
    AdolescenteReadSerializer,
    AdolescenteValReadSerializer,
    AdolescenteValidateSerializer,
    FamiliarSerializer,
    PersonaSerializer,
    RelacionAdolescenteCreateSerializer,
    RelacionAdolescenteSerializer,
)
from src.apps.persona.models import RelacionAdolescente
from src.apps.domicilio.models import Institucion
from src.apps.domicilio.serializers import InstitucionSerializer
from .comentarios import puede_comentar_solicitud, puede_editar_comentario
from .permissions import puede_agregar_familiares, puede_gestionar_admision


def _valor_comparable(valor):
    """Convierte datos validados en una forma estable para compararlos."""
    if hasattr(valor, "_meta") and hasattr(valor, "pk"):
        return (valor._meta.label_lower, valor.pk)
    if isinstance(valor, Mapping):
        return tuple(
            sorted((clave, _valor_comparable(dato)) for clave, dato in valor.items())
        )
    if isinstance(valor, (list, tuple)):
        return tuple(_valor_comparable(dato) for dato in valor)
    return valor

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
    motivo = MotivoSolicitudSerializer(read_only=True)
    equipo = EquipoSerializer(read_only=True)
    validado = serializers.BooleanField(read_only=True)
    rechazado = serializers.BooleanField(read_only=True)

    def get_titulo(self, solicitud):
        if solicitud.fecha_hora_admision is None:
            return solicitud.motivo.nombre
        nombres = []
        for adolescente in solicitud.adolescentes.all():
            persona = adolescente.persona or adolescente
            nombre = f"{persona.nombre} {persona.apellido}".strip()
            if nombre:
                nombres.append(nombre)
        return " · ".join(nombres) or f"Solicitud #{solicitud.pk}"

    class Meta:
        model = Solicitud
        fields = [
            'id',
            'titulo',
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
        if "institucion" in self.initial_data and "id_institucion" in self.initial_data:
            raise serializers.ValidationError({
                "institucion": "Envíe institucion o id_institucion, no ambos."
            })
        if attrs.get("institucion") is None:
            raise serializers.ValidationError({
                "institucion": "La institución solicitante es obligatoria."
            })

        ids_temp = [adolescente["id_temp"] for adolescente in attrs["adolescentes"]]
        if len(ids_temp) != len(set(ids_temp)):
            raise serializers.ValidationError({"adolescentes": "Los id_temp no pueden repetirse."})

        referencias_temporales = {}
        for adolescente in attrs["adolescentes"]:
            for referencia in adolescente.get("referencias_instituciones_data", []):
                id_temp = referencia.get("id_temp")
                if id_temp is None:
                    continue
                definicion = _valor_comparable({
                    campo: valor
                    for campo, valor in referencia.items()
                    if campo != "id_temp"
                })
                anterior = referencias_temporales.setdefault(id_temp, definicion)
                if anterior != definicion:
                    raise serializers.ValidationError({
                        "adolescentes": (
                            "Una referencia con el mismo id_temp debe tener "
                            "los mismos datos."
                        )
                    })

        relaciones = set()
        for relacion in attrs.get("relaciones_adolescentes", []):
            primero, segundo = relacion["id_temp1"], relacion["id_temp2"]
            if primero not in ids_temp or segundo not in ids_temp:
                raise serializers.ValidationError({
                    "relaciones_adolescentes": "Los id_temp deben pertenecer a esta solicitud."
                })
            if primero == segundo:
                raise serializers.ValidationError({
                    "relaciones_adolescentes": "Un adolescente no puede relacionarse consigo mismo."
                })
            clave = (primero, segundo, relacion["vinculo"].pk)
            if clave in relaciones:
                raise serializers.ValidationError({"relaciones_adolescentes": "Hay relaciones repetidas."})
            relaciones.add(clave)
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
        relaciones = RelacionAdolescente.objects.filter(
            adolescente1__solicitud=obj, adolescente2__solicitud=obj,
        ).select_related("vinculo").order_by("id")
        return RelacionAdolescenteSerializer(relaciones, many=True).data

    def get_familiares_validados(self, obj):
        familiares = obj.familiares.filter(persona__isnull=False).select_related(
            "persona__legajo__carpeta"
        ).order_by("id")
        personas = []
        ids_personas = set()
        for familiar in familiares:
            if familiar.persona_id in ids_personas:
                continue
            ids_personas.add(familiar.persona_id)
            personas.append(familiar.persona)
        return PersonaSerializer(
            personas,
            many=True,
        ).data


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

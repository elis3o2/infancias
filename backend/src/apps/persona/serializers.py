from django.db.models import Q
from rest_framework import serializers
from src.apps.solicitud.models import Solicitud, SolicitudComentario
from .models import (Carpeta, Legajo, Persona, Adolescente, Relacion, Familiar, Vinculo, RelacionAdolescente)
from src.apps.domicilio.models import Institucion
from src.apps.domicilio.serializers import (
    DomicilioSerializer, InstitucionSerializer, ReferenciaInstitucionInputSerializer,
)


VINCULOS_FAMILIARES = Vinculo.objects.filter(adolescente=False)
VINCULOS_ENTRE_ADOLESCENTES = Vinculo.objects.filter(adolescente=True)

class CarpetaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Carpeta
        fields = ("id", "id_insert")


class LegajoSerializer(serializers.ModelSerializer):
    carpeta = CarpetaSerializer(read_only=True)

    class Meta:
        model = Legajo
        fields = ("id", "id_insert", "carpeta")


class LegajoInputSerializer(serializers.Serializer):
    id             = serializers.IntegerField(required=False, min_value=1)
    id_insert      = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    carpeta_id     = serializers.IntegerField(required=False, allow_null=True, min_value=1)


class PersonaSerializer(serializers.ModelSerializer):
    legajo = LegajoSerializer(read_only=True)
    domicilio = serializers.SerializerMethodField()
    telefono = serializers.SerializerMethodField()

    class Meta:
        model = Persona
        fields = "__all__"

    def get_domicilio(self, obj):
        registro = obj.domicilios.select_related("domicilio").order_by(
            "-fecha_carga"
        ).first()
        return DomicilioSerializer(registro.domicilio).data if registro else None

    def get_telefono(self, obj):
        registro = obj.telefonos.order_by("-fecha_carga").first()
        return registro.telefono if registro else None


class VinculoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vinculo
        fields = ["id", "nombre"]



class FamiliarSerializer(serializers.ModelSerializer):
    id_vinculo = serializers.PrimaryKeyRelatedField(
        queryset=VINCULOS_FAMILIARES,
        source="vinculo",
        write_only=True,
        required=False,
    )
    vinculo   = VinculoSerializer(read_only=True)
    persona   = PersonaSerializer(read_only=True)
    domicilio = DomicilioSerializer(required=False, allow_null=True)

    class Meta:
        model = Familiar
        exclude = ["solicitud"]
        read_only_fields = ["adolescente"]

    def validate(self, attrs):
        for field in ("nombre", "apellido"):
            if field in attrs:
                attrs[field] = attrs[field].strip()

        for field in ("dni", "sexo", "telefono"):
            value = attrs.get(field)
            if isinstance(value, str):
                attrs[field] = value.strip() or None

        sexo = attrs.get("sexo")
        if sexo is not None:
            sexo = sexo.upper()
            if sexo not in {"M", "F", "X"}:
                raise serializers.ValidationError(
                    {"sexo": "El sexo debe ser M, F o X."}
                )
            attrs["sexo"] = sexo

        return attrs


class FamiliarCreateSerializer(FamiliarSerializer):
    dni = serializers.RegexField(
        regex=r"^[0-9]{7,8}$",
        error_messages={
            "required": "El DNI del familiar es obligatorio.",
            "null": "El DNI del familiar es obligatorio.",
            "blank": "El DNI del familiar es obligatorio.",
            "invalid": "El DNI del familiar debe tener entre 7 y 8 dígitos.",
        },
    )

    class Meta(FamiliarSerializer.Meta):
        exclude = None
        fields = ["nombre", "apellido", "sexo", "dni", "telefono", "domicilio",
                  "id_vinculo", "vinculo", "persona"]




class RelacionAdolescenteCreateSerializer(serializers.Serializer):
    id_temp1 = serializers.CharField(max_length=64)
    id_temp2 = serializers.CharField(max_length=64)
    id_vinculo = serializers.PrimaryKeyRelatedField(
        queryset=VINCULOS_ENTRE_ADOLESCENTES, source="vinculo")


class RelacionAdolescenteSerializer(serializers.ModelSerializer):
    vinculo = VinculoSerializer(read_only=True)

    class Meta:
        model = RelacionAdolescente
        fields = ["id", "adolescente1", "adolescente2", "vinculo"]


class AdolescenteCreateSerializer(serializers.ModelSerializer):
    domicilio  = DomicilioSerializer()
    dni = serializers.CharField(max_length=9)
    id_temp = serializers.CharField(max_length=64, write_only=True)
    familiares = FamiliarCreateSerializer(many=True, required=False)
    referencias_instituciones_data = ReferenciaInstitucionInputSerializer(
        many=True, required=False)

    class Meta:
        model = Adolescente
        fields = [
            "id_temp",
            "familiares",
            "referencias_instituciones_data",
            "dni",
            "sexo",
            "nombre",
            "apellido",
            "fecha_nacimiento",
            "escolarizado",
            "domicilio",
        ]


    def validate(self, attrs):
        attrs["dni"] = attrs["dni"].strip()
        attrs["sexo"] = attrs["sexo"].strip().upper()
        attrs["nombre"] = attrs["nombre"].strip()
        attrs["apellido"] = attrs["apellido"].strip()
        if attrs["sexo"] not in {"M", "F", "X"}:
            raise serializers.ValidationError({"sexo": "El sexo debe ser M, F o X."})
        return attrs


class AdolescenteReadSerializer(serializers.ModelSerializer):
    domicilio = DomicilioSerializer(read_only=True)
    persona = PersonaSerializer(read_only=True)
    relaciones = serializers.SerializerMethodField()
    familiares = FamiliarSerializer(many=True, read_only=True)
    referencias_instituciones = serializers.SerializerMethodField()

    class Meta:
        model = Adolescente
        fields = [
            "id",
            "dni",
            "sexo",
            "nombre",
            "apellido",
            "domicilio",
            "fecha_nacimiento",
            "escolarizado",
            "persona",
            "relaciones",
            "familiares",
            "referencias_instituciones",
        ]

    def get_referencias_instituciones(self, obj):
        referencias = obj.referencias_instituciones.select_related("institucion")
        return InstitucionSerializer(
            [referencia.institucion for referencia in referencias], many=True,
        ).data

    def get_relaciones(self, obj):
        if obj.persona_id is None:
            return []

        relaciones = (
            Relacion.objects.filter(
                Q(persona_1=obj.persona) | Q(persona_2=obj.persona)
            )
            .select_related("persona_1", "persona_2", "vinculo")
            .order_by("id")
        )

        resultado = []
        for relacion in relaciones:
            relacionada = (
                relacion.persona_2
                if relacion.persona_1_id == obj.persona_id
                else relacion.persona_1
            )
            resultado.append(
                {
                    "id": relacion.id,
                    "vinculo": VinculoSerializer(relacion.vinculo).data,
                    "persona": PersonaSerializer(relacionada).data,
                }
            )
        return resultado

class AdolescenteValReadSerializer(AdolescenteReadSerializer):
    """Alias semántico para las solicitudes procesadas."""


class SaludDatosSerializer(serializers.Serializer):
    hc = serializers.IntegerField(required=False, allow_null=True)
    hcf = serializers.IntegerField(required=False, allow_null=True)
    discapacidades = serializers.BooleanField(required=False)
    consumos_problematicos = serializers.BooleanField(required=False)
    intentos_de_suicidio = serializers.BooleanField(required=False)
    problemas_socioambientales = serializers.BooleanField(required=False)
    violencias = serializers.BooleanField(required=False)


class PersonaValidateSerializer(SaludDatosSerializer):
    nombre = serializers.CharField(max_length=32)
    apellido = serializers.CharField(max_length=32)
    dni = serializers.CharField(max_length=9)
    sexo = serializers.ChoiceField(choices=("M", "F", "X"))
    fecha_nacimiento = serializers.DateField()


class FamiliarValidateSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False, min_value=1)
    persona = PersonaValidateSerializer()
    vinculo = serializers.PrimaryKeyRelatedField(
        queryset=VINCULOS_FAMILIARES, required=False)
    id_vinculo = serializers.PrimaryKeyRelatedField(
        queryset=VINCULOS_FAMILIARES, source="vinculo", required=False, write_only=True)
    telefono = serializers.CharField(
        max_length=16, required=False, allow_blank=True, allow_null=True)
    domicilio = DomicilioSerializer(required=False, allow_null=True)

    def to_internal_value(self, data):
        if "vinculo" in data and "id_vinculo" in data:
            raise serializers.ValidationError({"vinculo": "Envíe vinculo o id_vinculo, no ambos."})
        return super().to_internal_value(data)

    def validate(self, attrs):
        if attrs.get("vinculo") is None:
            raise serializers.ValidationError({"vinculo": "El vínculo es obligatorio."})
        return attrs


class PersonaRelacionSerializer(serializers.Serializer):
    # Si referencia un familiar ya cargado en la solicitud.
    id_familiar = serializers.IntegerField(required=False, allow_null=True)
    dni         = serializers.CharField(max_length=9)
    sexo        = serializers.CharField(max_length=1)
    nombre      = serializers.CharField(max_length=32)
    apellido    = serializers.CharField(max_length=32)
    fecha_nacimiento = serializers.DateField()
    id_vinculo  = serializers.IntegerField(required=False, allow_null=True)
    # Algunos formularios aún mandan el objeto Vinculo completo.
    vinculo = serializers.JSONField(required=False, allow_null=True, write_only=True)
    legajo      = LegajoInputSerializer(required=False, allow_null=True)
    telefono    = serializers.CharField(max_length=16, required=False, allow_null=True, allow_blank=True)
    domicilio   = DomicilioSerializer(required=False, allow_null=True)
    salud = SaludDatosSerializer(required=False, write_only=True)

    def validate(self, attrs):
        attrs["dni"] = attrs["dni"].strip()
        attrs["sexo"] = attrs["sexo"].strip().upper()
        attrs["nombre"] = attrs["nombre"].strip()
        attrs["apellido"] = attrs["apellido"].strip()
        if attrs["sexo"] not in {"M", "F", "X"}:
            raise serializers.ValidationError({"sexo": "El sexo debe ser M, F o X."})

        telefono = attrs.get("telefono")
        if isinstance(telefono, str):
            attrs["telefono"] = telefono.strip() or None

        vinculo = attrs.pop("vinculo", None)
        if attrs.get("id_vinculo") is None and isinstance(vinculo, dict):
            vinculo_id = vinculo.get("id")
            if vinculo_id is not None:
                attrs["id_vinculo"] = vinculo_id

        salud = attrs.pop("salud", None)
        if salud is not None:
            attrs.update(salud)

        return attrs


class AdolescenteValidateSerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    persona = PersonaValidateSerializer()
    familiares = FamiliarValidateSerializer(many=True, required=False)
    legajo = LegajoInputSerializer(required=False, allow_null=True)



class PersonaConsultaInputSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    sexo = serializers.CharField(
        max_length=1,
        required=False,
        allow_null=True,
        allow_blank=True,
    )
    dni = serializers.CharField(max_length=9)

    def validate(self, attrs):
        attrs["dni"] = attrs["dni"].strip()
        sexo = attrs.get("sexo")
        if sexo:
            sexo = sexo.strip().upper()
            if sexo not in {"M", "F", "X"}:
                raise serializers.ValidationError({"sexo": "El sexo debe ser M, F o X."})
            attrs["sexo"] = sexo
        else:
            attrs["sexo"] = None
        return attrs


class ConsultaPersonasSerializer(serializers.Serializer):
    adolescentes = PersonaConsultaInputSerializer(many=True)
    familiares = PersonaConsultaInputSerializer(many=True, required=False, default=list)


class BusquedaHistorialSerializer(serializers.Serializer):
    nombre = serializers.CharField(required=False, allow_blank=True, max_length=64)
    apellido = serializers.CharField(required=False, allow_blank=True, max_length=64)
    dni = serializers.RegexField(r"^[0-9]{7,9}$", required=False)
    legajo = serializers.IntegerField(required=False, min_value=1, max_value=2147483647)

    def validate(self, attrs):
        if not any(attrs.values()):
            raise serializers.ValidationError("Ingrese nombre, apellido, DNI o número de legajo para buscar.")
        for campo in ("nombre", "apellido"):
            if attrs.get(campo) and len(attrs[campo]) < 2:
                raise serializers.ValidationError({campo: "Ingrese al menos 2 caracteres."})
        return attrs


class NinoHistorialSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nombre = serializers.CharField()
    apellido = serializers.CharField()
    dni = serializers.CharField()
    sexo = serializers.CharField()
    fecha_nacimiento = serializers.DateField()
    legajo = serializers.IntegerField(allow_null=True)
    carpeta = serializers.IntegerField(allow_null=True)
    validado = serializers.BooleanField()


class IntervencionHistorialSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source="usuario.username", read_only=True)

    class Meta:
        model = SolicitudComentario
        fields = ["id", "comentario", "usuario_nombre", "fecha_hora_creacion", "fecha_hora_ultmod"]


class SolicitudHistorialSerializer(serializers.ModelSerializer):
    motivo = serializers.CharField(source="motivo.nombre", read_only=True)
    equipo = serializers.CharField(source="equipo.nombre", read_only=True)
    comentarios = IntervencionHistorialSerializer(many=True, read_only=True)

    class Meta:
        model = Solicitud
        fields = [
            "id", "motivo", "equipo", "validado", "rechazado", "descripcion", "descripcion_extra",
            "motivo_rechazo", "fecha_hora_creacion", "fecha_hora_entrada", "fecha_hora_admision", "comentarios",
        ]

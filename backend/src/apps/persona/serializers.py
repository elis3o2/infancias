from django.db.models import Q
from rest_framework import serializers
from .models import (Carpeta, Legajo, Persona, Adolescente, Relacion, Familiar,
    Vinculo)
from src.apps.domicilio.serializers import DomicilioSerializer

class CarpetaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Carpeta
        fields = ("id", "id_insert")


class LegajoSerializer(serializers.ModelSerializer):
    carpeta = CarpetaSerializer(read_only=True)

    class Meta:
        model = Legajo
        fields = ("id", "id_insert", "carpeta")


class CarpetaInputSerializer(serializers.Serializer):
    id        = serializers.IntegerField(required=False)
    id_insert = serializers.IntegerField(required=False, allow_null=True)


class LegajoInputSerializer(serializers.Serializer):
    id             = serializers.IntegerField(required=False)
    id_insert      = serializers.IntegerField(required=False, allow_null=True)
    carpeta_id     = serializers.IntegerField(required=False, allow_null=True)
    # Compatibilidad de escritura para clientes antiguos. Las letras ya no
    # forman parte del contrato: la base las resuelve internamente.
    letra = serializers.CharField(required=False, allow_blank=True, max_length=1, write_only=True)

    def validate(self, attrs):
        for campo in ("letra", "carpeta_letra", "carperta_letra"):
            attrs.pop(campo, None)
        return attrs


class PersonaSerializer(serializers.ModelSerializer):
    legajo = LegajoSerializer(read_only=True)

    class Meta:
        model = Persona
        fields = "__all__"


class VinculoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vinculo
        fields = "__all__"


class FamiliarSerializer(serializers.ModelSerializer):
    id_vinculo = serializers.PrimaryKeyRelatedField(
        queryset=Vinculo.objects.all(),
        source="vinculo",
        write_only=True,
        required=True,
    )
    vinculo   = VinculoSerializer(read_only=True)
    persona   = PersonaSerializer(read_only=True)
    domicilio = DomicilioSerializer(required=False, allow_null=True)

    class Meta:
        model = Familiar
        exclude = ["solicitud"]

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



class AdolescenteCreateSerializer(serializers.ModelSerializer):
    domicilio  = DomicilioSerializer()

    class Meta:
        model = Adolescente
        fields = [
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
        ]

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

        return attrs


class AdolescenteWriteSerializer(serializers.Serializer):
    """Decisión de validación de un adolescente dentro de una solicitud."""

    id = serializers.IntegerField()
    # Los clientes anteriores no enviaban estado: se conservan como
    # confirmaciones para no romper el contrato existente.
    adolescente_validado = PersonaRelacionSerializer(required=False)
    familiares_validados = PersonaRelacionSerializer(many=True, required=False)

    def validate(self, attrs):
        estado = attrs["estado"]

        if estado == "confirmado":
            if "adolescente_validado" not in attrs:
                raise serializers.ValidationError({
                    "adolescente_validado": (
                        "Debe informar los datos de un adolescente confirmado."
                    )
                })
            return attrs

        campos_sin_uso = {
            campo: "No se envían datos para un adolescente rechazado."
            for campo in (
                "adolescente_validado",
                "familiares_validados",
                "familiares_rechazados",
                "hermanos_validados",
            )
            if campo in attrs
        }
        if campos_sin_uso:
            raise serializers.ValidationError(campos_sin_uso)

        return attrs


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
    familiares = PersonaConsultaInputSerializer(many=True, required=False)

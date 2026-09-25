from rest_framework import serializers

from src.apps.domicilio.serializers import DomicilioSerializer
from src.apps.persona.serializers import (
    LegajoInputSerializer, PersonaValidateSerializer,
    VINCULOS_ENTRE_ADOLESCENTES, VINCULOS_FAMILIARES,
)


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

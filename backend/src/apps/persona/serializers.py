from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from .models import (Carpeta, Legajo, Persona, Adolescente, Relacion, Familiar, 
    Vinculo, Hermano, PersonaDomicilio, PersonaTelefono, AdolescenteInstitucion)
from src.apps.domicilio.models import Institucion
from src.apps.domicilio.serializers import (DomicilioSerializer, InstitucionSerializer, ReferenciaInstitucionInputSerializer)

class CarpetaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Carpeta
        fields = "__all__"


class LegajoSerializer(serializers.ModelSerializer):
    carpeta = CarpetaSerializer(read_only=True)

    class Meta:
        model = Legajo
        fields = "__all__"


class CarpetaInputSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    id_insert = serializers.IntegerField(required=False, allow_null=True)
    letra = serializers.CharField(required=False, allow_blank=True)


class LegajoInputSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    id_insert = serializers.IntegerField(required=False, allow_null=True)
    letra = serializers.CharField(required=False, allow_blank=True)
    carpeta_id = serializers.IntegerField(required=False, allow_null=True)


class PersonaSerializer(serializers.ModelSerializer):
    legajo = LegajoSerializer(read_only=True)

    class Meta:
        model = Persona
        fields = "__all__"


class HermanoSerializer(serializers.ModelSerializer):
    persona = PersonaSerializer(read_only=True)

    class Meta:
        model = Hermano
        exclude = ["adolescente"]


class VinculoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vinculo
        fields = "__all__"


class FamiliarSerializer(serializers.ModelSerializer):
    id_vinculo = serializers.PrimaryKeyRelatedField(
        queryset=Vinculo.objects.all(),
        source="vinculo",
        write_only=True,
        required=False,
    )

    vinculo = VinculoSerializer(read_only=True)
    persona = PersonaSerializer(read_only=True)

    class Meta:
        model = Familiar
        exclude = ["adolescente"]



class AdolescenteCreateSerializer(serializers.ModelSerializer):

    domicilio  = DomicilioSerializer()
    hermanos   = HermanoSerializer(many=True, required=False, write_only=True)
    familiares = FamiliarSerializer(many=True, required=False, write_only=True)
    referencias_instituciones_data = ReferenciaInstitucionInputSerializer(many=True, write_only=True, required=False)

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
            "hermanos",
            "familiares",
            "referencias_instituciones_data",
        ]


class AdolescenteReadSerializer(serializers.ModelSerializer):

    domicilio = DomicilioSerializer()
    hermanos = HermanoSerializer(many=True, required=False)
    familiares = FamiliarSerializer(many=True, required=False)
    referencias_instituciones = InstitucionSerializer(many=True, read_only=True)

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
            "hermanos",
            "familiares",
            "referencias_instituciones",
        ]


class AdolescenteValReadSerializer(serializers.ModelSerializer):
    domicilio = DomicilioSerializer(source="domicilio_extra")
    familiares = serializers.SerializerMethodField()
    familiares_validados = serializers.SerializerMethodField()
    adolescente_validado = serializers.SerializerMethodField()
    hermanos = serializers.SerializerMethodField() 
    hermanos_validados = serializers.SerializerMethodField()
    referencias_instituciones = serializers.SerializerMethodField()

    class Meta:
        model = Adolescente
        fields = [
            "id",
            "domicilio",
            "domicilio_observaciones",
            "familiares",
            "familiares_validados",
            "escolarizado",
            "adolescente_validado",
            "hermanos", 
            "hermanos_validados",
            "referencias_instituciones",
        ]

    def get_adolescente_validado(self, obj):
        if obj.adolescente_validado is None:
            return None
        return PersonaSerializer(obj.persona).data

    def get_hermanos(self, obj):
        if obj.adolescente_validado is None:
            return []
        
        hermanos = Hermano.objects.filter(
            adolescente=obj,
            persona__isnull=True 
        )
        return HermanoSerializer(hermanos, many=True).data
    
    def get_hermanos_validados(self, obj):
            if obj.adolescente_validado is None:
                return []

            legajos = Legajo.objects.filter(
                carpeta=obj.persona.legajo.carpeta
            ).exclude(letra="C").exclude(id=obj.persona.legajo.id)

            hermanos = Persona.objects.filter(
                legajo__in=legajos
            ).exclude(id=obj.persona.id)

            return PersonaSerializer(hermanos, many=True).data
    
    def get_familiares(self, obj):
        familiares = Familiar.objects.filter(
            adolescente=obj,
            persona__isnull=True
        )
        return FamiliarSerializer(familiares, many=True).data


    def get_familiares_validados(self, obj):
        if getattr(obj, 'persona', None) is None: return [] # Prevención de error

        legajos = Legajo.objects.filter(
            carpeta=obj.persona.legajo.carpeta,
            letra="C"
        )
        familiares = Persona.objects.filter(legajo__in=legajos)
        
        return FamiliarSerializer(familiares, many=True).data


    def get_referencias_instituciones(self, obj):
        referencias = AdolescenteInstitucion.objects.filter(
            adolescente=obj,
            valido=True
        )
        instituciones = [ref.institucion for ref in referencias]
        return InstitucionSerializer(instituciones, many=True).data



class PersonaRelacionSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)

    # Si referencia un Familiar/Hermano ya cargado
    id_familiar = serializers.IntegerField(required=False, allow_null=True)
    id_hermano = serializers.IntegerField(required=False, allow_null=True)
    dni = serializers.CharField(max_length=10)
    sexo = serializers.CharField(max_length=1)
    nombre = serializers.CharField(max_length=64)
    apellido = serializers.CharField(max_length=64)
    fecha_nacimiento = serializers.DateField()
    id_vinculo = serializers.IntegerField(required=False)
    legajo = LegajoInputSerializer(required=False, allow_null=True)
    telefono = serializers.CharField(max_length=16, required=False, allow_null=True, allow_blank=True)
    domicilio = DomicilioSerializer(required=False, allow_null=True)



class AdolescenteWriteSerializer(serializers.ModelSerializer):

    adolescente_validado = PersonaRelacionSerializer(required=True)
    hermanos_validados = PersonaRelacionSerializer(many=True, required=False)

    familiares_validados = PersonaRelacionSerializer(many=True, required=False)

    class Meta:
        model = Adolescente
        fields = [
            "id",
            "adolescente_validado",
            "hermanos_validados",
            "familiares_validados",
        ]

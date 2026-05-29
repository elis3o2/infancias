from rest_framework import serializers
from .models import Atencion, AtencionGrupoFamiliar
from src.apps.domicilio.serializers import InstitucionSerializer
from src.apps.persona.serializers import MenorSerializer
from src.apps.habitat.serializers import HabitatSerializer
from src.apps.grupo_familiar.serializers import GrupoFamiliarSerializer
from src.apps.habitat.models import Habitat
from src.apps.grupo_familiar.models import GrupoFamiliar

class AtencionSerializer(serializers.ModelSerializer):
    institucion = InstitucionSerializer(read_only=True)
    menor = MenorSerializer(read_only=True)
    grupos_familiares = GrupoFamiliarSerializer(many=True, read_only=True)
    habitat = HabitatSerializer(read_only=True)

    ids_grupos_familiares = serializers.PrimaryKeyRelatedField(source="grupos_familiares", queryset=GrupoFamiliar.objects.all(), many=True, write_only=True)
    id_habitat = serializers.PrimaryKeyRelatedField(source="habitat", queryset=Habitat.objects.all(), write_only=True)

    class Meta:
        model = Atencion
        fields = ['id', 'menor', 'institucion', 'fecha_hora_creacion', 'habitat', 'grupos_familiares',
        'ids_grupos_familiares', 'id_habitat']


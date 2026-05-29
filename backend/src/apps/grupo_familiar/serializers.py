from rest_framework import serializers
from .models import Comedor, TUC, AUH, PensionContributiva, PensionNoContributiva, Programa, GrupoFamiliar


class ComedorSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Comedor
        fields = ['id', 'nombre']


class TUCSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TUC
        fields = ['id', 'nombre']


class AUHSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AUH
        fields = ['id', 'nombre']


class PensionContributivaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PensionContributiva
        fields = ['id', 'nombre']



class PensionNoContributivaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PensionNoContributiva
        fields = ['id', 'nombre']


class ProgramaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Programa
        fields = ['id', 'nombre']
    

class GrupoFamiliarSerializer(serializers.ModelSerializer):
    comedor = ComedorSerializer(read_only=True)
    tuc = TUCSerializer(read_only=True)
    auh = AUHSerializer(read_only=True)
    pension_cont = PensionContributivaSerializer(read_only=True)
    pension_no_cont = PensionNoContributivaSerializer(read_only=True)
    programa = ProgramaSerializer(read_only=True)

    id_comedor = serializers.PrimaryKeyRelatedField(source="comedor", queryset=Comedor.objects.all(), write_only=True)
    id_tuc = serializers.PrimaryKeyRelatedField(source="tuc", queryset=TUC.objects.all(), write_only=True)
    id_auh = serializers.PrimaryKeyRelatedField(source="auh", queryset=AUH.objects.all(), write_only=True)
    id_pension_cont = serializers.PrimaryKeyRelatedField(source="pension_cont", required=False, queryset=PensionContributiva.objects.all(), write_only=True)
    id_pension_no_cont = serializers.PrimaryKeyRelatedField(source="pension_no_cont", required=False, queryset=PensionNoContributiva.objects.all(), write_only=True)
    id_programa = serializers.PrimaryKeyRelatedField(source="programa", required=False, queryset=Programa.objects.all(), write_only=True)

    class Meta:
        model = GrupoFamiliar
        fields = ['id', 'comedor', 'tuc', 'auh', 'pension_cont', 'pension_no_cont', 'programa',
        'id_comedor', 'id_tuc', 'id_auh', 'id_pension_cont', 'id_pension_no_cont', 'id_programa']

        
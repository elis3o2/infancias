from rest_framework import serializers
from .models import Material, Tenencia, Habitat
from src.apps.domicilio.serializers import DomicilioSerializer

class TenenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenencia
        fields = '__all__'


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material 
        fields = '__all__'

    
class HabitatSerializer(serializers.ModelSerializer):
    domicilio = DomicilioSerializer()
    tenencia = TenenciaSerializer(read_only=True)
    material_pared = MaterialSerializer(read_only=True)
    material_techo = MaterialSerializer(read_only=True)
    material_piso  = MaterialSerializer(read_only=True)

    id_tenencia = serializers.PrimaryKeyRelatedField(source='tenencia', queryset=Tenencia.objects.all(), write_only=True)
    id_material_pared = serializers.PrimaryKeyRelatedField(source='material_pared', queryset=Material.objects.all(), write_only=True)
    id_material_techo = serializers.PrimaryKeyRelatedField(source='material_techo', queryset=Material.objects.all(), write_only=True)
    id_material_piso = serializers.PrimaryKeyRelatedField(source='material_piso', queryset=Material.objects.all(), write_only=True)

    class Meta:
        model = Habitat
        fields = ['id', 'domicilio', 'exclusividad_terreno', 'exclusividad_vivienda', 'material_pared', 'material_techo',
        'material_piso', 
        'agua_corriente', 'instalacion_electrica',
        'id_tenencia', 'id_material_techo', 'id_material_pared', 'id_material_piso']


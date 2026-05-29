from django.db import models
from src.apps.domicilio.models import Domicilio

class Tenencia(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=32)

    class Meta:
        managed = False
        db_table = "tenencia"

    
class Material(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=32)

    class Meta:
        managed = False
        db_table = "material"


class Habitat(models.Model):
    id = models.AutoField(primary_key=True)
    domicilio = models.ForeignKey(
        Domicilio, models.DO_NOTHING, db_column='id_domicilio')
    exclusividad_terreno = models.BooleanField()
    exclusividad_vivienda = models.BooleanField()
    tenencia = models.ForeignKey(
       Tenencia, models.DO_NOTHING, db_column='id_tenencia')
    material_pared = models.ForeignKey(
        Material, models.DO_NOTHING ,db_column='id_material_pared', related_name='material_pared')    
    material_techo = models.ForeignKey(
        Material, models.DO_NOTHING ,db_column='id_material_techo', related_name='material_techo')
    material_piso = models.ForeignKey(
        Material, models.DO_NOTHING ,db_column='id_material_piso', related_name='material_piso')    
    agua_corriente = models.BooleanField()
    instalacion_electrica = models.BooleanField()

    class Meta:
        managed = False
        db_table = "habitat"
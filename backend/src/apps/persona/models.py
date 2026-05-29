from django.db import models
from src.apps.domicilio.models import Domicilio, Efector

class Persona(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=32)
    apellido = models.CharField(max_length=32)
    domicilio = models.ForeignKey(
        Domicilio, models.DO_NOTHING, db_column='id_domicilio')
    telefono = models.CharField(max_length=16)
    fecha_nacimiento = models.DateField()

    class Meta:
        managed = False
        db_table = "persona"


class Escolaridad(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=16)

    class Meta:
        managed = False
        db_table = "escolaridad" 


class CCB(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=128)

    class Meta:
        managed = False
        db_table = "ccb"


class ObraSocial(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=128)

    class Meta:
        managed = False
        db_table = "obra_social"


class Menor(models.Model):
    id = models.AutoField(primary_key=True)
    persona = models.ForeignKey(
        Persona, models.DO_NOTHING, db_column='id_persona')
    escolaridad_actual = models.BooleanField()
    escolaridad = models.ForeignKey(
        Escolaridad, models.DO_NOTHING, db_column='id_escolaridad_actual')
    efector_ref = models.ForeignKey(
        Efector, models.DO_NOTHING, db_column='id_efector_ref')
    ccb_ref = models.ForeignKey(
        CCB, models.DO_NOTHING, db_column='id_ccb_ref')
    obra_social = models.ForeignKey(
        ObraSocial, models.DO_NOTHING, db_column='id_obra_social')
    
    class Meta:
        managed = False
        db_table = "menor"





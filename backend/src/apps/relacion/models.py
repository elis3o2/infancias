from django.db import models
from src.apps.persona.models import Persona, Menor

class Instruccion(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=32)

    class Meta:
        managed = False
        db_table = "instruccion"


class Ocupacion(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=32)

    class Meta:
        managed = False
        db_table = "ocupacion"


class TipoRelacion(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=32)

    class Meta:
        managed = False
        db_table = "tipo_relacion"


class Relacion(models.Model):
    id = models.AutoField(primary_key=True)
    menor = models.ForeignKey(
        Menor, models.DO_NOTHING, db_column='id_menor')
    familiar = models.ForeignKey(
        Persona, models.DO_NOTHING, db_column='id_familiar')
    tipo = models.ForeignKey(
        TipoRelacion, models.DO_NOTHING, db_column='id_tipo')
    convive = models.BooleanField()
    instruccion = models.ForeignKey(
        Instruccion, models.DO_NOTHING, db_column='id_instruccion')
    ocupacion = models.ForeignKey(
        Ocupacion, models.DO_NOTHING, db_column='id_ocupacion')

    class Meta:
        managed = False
        db_table = "relacion"
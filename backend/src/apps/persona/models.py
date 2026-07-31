from django.db import models
from src.apps.domicilio.models import Domicilio, Institucion

class Adolescente(models.Model):
    id = models.AutoField(primary_key=True)
    dni = models.CharField(max_length=10)
    sexo = models.CharField(max_length=1)
    nombre = models.CharField(max_length=32)
    apellido = models.CharField(max_length=32)
    domicilio = models.ForeignKey(
        Domicilio, models.DO_NOTHING, db_column='id_domicilio', blank=True, null=True)
    fecha_nacimiento = models.DateField()
    escolarizado = models.BooleanField()
    redes = models.ManyToManyField(
        'Institucion', through='AdolescenteRed', related_name='adolescentes')

    class Meta:
        managed = False
        db_table = "adolescente"


class AdolescenteValidado(models.Model):
    id = models.AutoField(primary_key=True)
    dni = models.CharField(max_length=10)
    sexo = models.CharField(max_length=1)
    nombre = models.CharField(max_length=32)
    apellido = models.CharField(max_length=32)
    fecha_nacimiento = models.DateField()
    adolescente = models.ForeignKey(
        Adolescente, models.DO_NOTHING, db_column="id_adolecente")
    class Meta:
        managed = False
        db_table = "adolescente_validado"


class Solicitante(models.Model):
    id = models.AutoField(primary_key=True)
    dni = models.CharField(max_length=10)
    sexo = models.CharField(max_length=1)
    nombre = models.CharField(max_length=32)
    apellido = models.CharField(max_length=32)
    telefono = models.CharField(max_length=16)
    correo = models.CharField(max_length=32)

    class Meta:
        managed = False
        db_table = "solicitante"


class Hermano(models.Model):
    id = models.AutoField(primary_key=True)
    dni = models.CharField(max_length=10)
    sexo = models.CharField(max_length=1)
    nombre = models.CharField(max_length=32)
    apellido = models.CharField(max_length=32)
    fecha_nacimiento = models.DateField()
    adolescente = models.ForeignKey(
        Adolescente, models.DO_NOTHING, db_column="id_adolescente")

    class Meta:
        managed = False 
        db_table = "hermano"


class HermanoValidado(models.Model):
    id = models.AutoField(primary_key=True)
    dni = models.CharField(max_length=10)
    sexo = models.CharField(max_length=1)
    nombre = models.CharField(max_length=32)
    apellido = models.CharField(max_length=32)
    fecha_nacimiento = models.DateField()
    hemano = models.ForeignKey(
        Hermano, models.DO_NOTHING, db_column="id_hermano")

    class Meta:
        managed = False 
        db_table = "hermano"


class Vinculo(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)

    class Meta:
        managed = False
        db_table = 'vinculo'


class Familiar(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)
    apellido = models.CharField(max_length=64) 
    adolescente = models.ForeignKey(
        Adolescente, models.DO_NOTHING, db_column="id_adolescente", related_name="familiares")
    vinculo = models.ForeignKey(
        Vinculo, models.DO_NOTHING, db_column='id_vinculo')
    telefono = models.CharField(max_length=16)

    class Meta:
        managed = False
        db_table = 'familiar'


class AdolescenteRed(models.Model):
    id = models.AutoField(primary_key=True)
    adolescete = models.ForeignKey(
        Adolescente, models.DO_NOTHING, db_column='id_adolescente')
    institucion = models.ForeignKey(
        Institucion, models.DO_NOTHING, db_column='id_institucion')

    class Meta:
        managed = False 
        db_table = 'adolescente_red'
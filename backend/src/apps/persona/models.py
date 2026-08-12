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

    referencias_instituciones = models.ManyToManyField(
        "Institucion",
        through="AdolescenteInstitucion",
        related_name="instituciones"
    )

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
        Adolescente, models.DO_NOTHING, db_column="id_adolescente")

    class Meta:
        managed = False
        db_table = "adolescente_validado"


class Solicitante(models.Model):
    id = models.AutoField(primary_key=True)
    dni = models.CharField(max_length=10, blank=True, null=True)
    nombre = models.CharField(max_length=32)
    apellido = models.CharField(max_length=32)

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
        Adolescente, models.DO_NOTHING, db_column="id_adolescente", related_name="hermanos", unique=True)

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
    hermano = models.ForeignKey(
        Hermano, models.DO_NOTHING, db_column="id_hermano",unique=True)

    class Meta:
        managed = False 
        db_table = "hermano_validado"


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


class AdolescenteInstitucion(models.Model):
    id = models.AutoField(primary_key=True)
    adolescente = models.ForeignKey(
        Adolescente, models.DO_NOTHING, db_column="id_adolescente")
    institucion = models.ForeignKey(
        Institucion, models.DO_NOTHING, db_column="id_institucion")
    
    class Meta:
        managed = False
        db_table = "adolescente_institucion"

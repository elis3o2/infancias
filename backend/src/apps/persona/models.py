from django.db import models
from src.apps.domicilio.models import Domicilio, Institucion

class Carpeta(models.Model):
    id = models.AutoField(primary_key=True)
    id_insert = models.IntegerField(null=True, blank=True)
    letra = models.CharField(max_length=1)

    class Meta:
        managed = False
        db_table = "carpeta"


class Legajo(models.Model):
    id = models.AutoField(primary_key=True)
    id_insert = models.IntegerField(null=True, blank=True)
    carpeta = models.ForeignKey(
        Carpeta, models.DO_NOTHING, db_column="id_carpeta")
    letra = models.CharField(max_length=1)

    class Meta:
        managed = False
        db_table = "legajo"


class Persona(models.Model):
    id = models.AutoField(primary_key=True)
    dni = models.CharField(max_length=10)
    sexo = models.CharField(max_length=1)
    nombre = models.CharField(max_length=32)
    apellido = models.CharField(max_length=32)
    fecha_nacimiento = models.DateField()
    legajo = models.ForeignKey(
        Legajo, models.DO_NOTHING, db_column="id_legajo")

    class Meta:
        managed = False
        db_table = "adolescente_validado"


class Vinculo(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)

    class Meta:
        managed = False
        db_table = "vinculo"
        ordering = ["nombre"]


class Relacion(models.Model):
    id = models.AutoField(primary_key=True)
    persona_1 = models.ForeignKey(
        Persona, models.DO_NOTHING, db_column="id_persona_1", related_name="relaciones_como_persona_1")
    persona_2 = models.ForeignKey(
        Persona, models.DO_NOTHING, db_column="id_persona_2", related_name="relaciones_como_persona_2")
    vinculo = models.ForeignKey(
        Vinculo, models.DO_NOTHING, db_column="id_vinculo")

    class Meta:
        managed = False
        db_table = "relacion"


class PersonaDomicilio(models.Model):
    id = models.AutoField(primary_key=True)
    persona = models.ForeignKey(
        Persona, models.DO_NOTHING, db_column="id_persona", related_name="domicilios")
    domicilio = models.ForeignKey(
        Domicilio, models.DO_NOTHING, db_column="id_domicilio", related_name="personas")
    fecha_carga = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "persona_domicilio"


class PersonaTelefono(models.Model):
    id = models.AutoField(primary_key=True)
    persona = models.ForeignKey(
        Persona, models.DO_NOTHING, db_column="id_persona", related_name="telefonos")
    telefono = models.CharField(max_length=16)
    fecha_carga = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "persona_telefono"


class Adolescente(models.Model):
    id = models.AutoField(primary_key=True)
    dni = models.CharField(max_length=10)
    sexo = models.CharField(max_length=1)
    nombre = models.CharField(max_length=32)
    apellido = models.CharField(max_length=32)
    domicilio = models.ForeignKey(
        Domicilio, models.DO_NOTHING, db_column="id_domicilio", related_name="adolescentes", blank=True, null=True)
    fecha_nacimiento = models.DateField()
    escolarizado = models.BooleanField(null=True, blank=True)
    referencias_instituciones = models.ManyToManyField(
        "Institucion", through="AdolescenteInstitucion", related_name="adolescentes")
    persona = models.ForeignKey(
        Persona, models.DO_NOTHING, db_column="id_persona", related_name="adolescentes", blank=True, null=True)

    class Meta:
        managed = False
        db_table = "adolescente"


class Hermano(models.Model):
    id = models.AutoField(primary_key=True)
    dni = models.CharField(max_length=10)
    sexo = models.CharField(max_length=1)
    nombre = models.CharField(max_length=32)
    apellido = models.CharField(max_length=32)
    fecha_nacimiento = models.DateField()
    adolescente = models.ForeignKey(
        Adolescente, models.DO_NOTHING, db_column="id_adolescente", related_name="hermanos")
    persona = models.ForeignKey(
        Persona, models.DO_NOTHING, db_column="id_persona", related_name="hermanos", blank=True, null=True)

    class Meta:
        managed = False
        db_table = "hermano"


class Familiar(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)
    apellido = models.CharField(max_length=64)
    dni = models.CharField(max_length=9, null=True, blank=True)
    sexo = models.CharField(max_length=1, null=True, blank=True)
    adolescente = models.ForeignKey(
        Adolescente, models.DO_NOTHING, db_column="id_adolescente", related_name="familiares")
    vinculo = models.ForeignKey(
        Vinculo, models.DO_NOTHING, db_column="id_vinculo")
    telefono = models.CharField(max_length=16, null=True, blank=True)
    domicilio = models.ForeignKey(
        Domicilio, models.DO_NOTHING, db_column="id_domicilio", blank=True, null=True)
    persona = models.ForeignKey(
        Persona, models.DO_NOTHING, db_column="id_persona", related_name="familiares", null=True, blank=True)

    class Meta:
        managed = False
        db_table = "familiar"


class AdolescenteInstitucion(models.Model):
    id = models.AutoField(primary_key=True)
    adolescente = models.ForeignKey(
        Adolescente, models.DO_NOTHING, db_column="id_adolescente")
    institucion = models.ForeignKey(
        Institucion, models.DO_NOTHING, db_column="id_institucion")

    class Meta:
        managed = False
        db_table = "adolescente_institucion"


class Equipo(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)

    class Meta:
        managed = False
        db_table = "equipo"
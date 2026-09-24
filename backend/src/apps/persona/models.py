from django.db import models
from src.apps.domicilio.models import Domicilio, Institucion
from src.apps.solicitud.models import Solicitud

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
    dni = models.CharField(max_length=9)
    sexo = models.CharField(max_length=1)
    nombre = models.CharField(max_length=32)
    apellido = models.CharField(max_length=32)
    fecha_nacimiento = models.DateField()
    legajo = models.ForeignKey(
        Legajo, models.DO_NOTHING, db_column="id_legajo", null=True, blank=True)
    hc = models.IntegerField(blank=True, null=True)
    hcf = models.IntegerField(blank=True, null=True)
    discapacidades = models.BooleanField()
    consumos_problematicos = models.BooleanField()
    intentos_de_suicidio = models.BooleanField()
    problemas_socioambientales = models.BooleanField()
    violencias = models.BooleanField()

    class Meta:
        managed = False
        db_table = "persona"


class Vinculo(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)
    adolescente = models.BooleanField()

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
    persona = models.ForeignKey(
        Persona, models.DO_NOTHING, db_column="id_persona", related_name="adolescentes", blank=True, null=True)
    solicitud = models.ForeignKey(
        Solicitud, models.DO_NOTHING, db_column="id_solicitud", related_name="adolescentes")

    class Meta:
        managed = False
        db_table = "adolescente"


class Familiar(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=32)
    apellido = models.CharField(max_length=32)
    dni = models.CharField(max_length=9, null=True, blank=True)
    sexo = models.CharField(max_length=1, null=True, blank=True)
    solicitud = models.ForeignKey(
        Solicitud, models.DO_NOTHING, db_column="id_solicitud", related_name="familiares")
    vinculo = models.ForeignKey(
        Vinculo, models.DO_NOTHING, db_column="id_vinculo", null=True, blank=True)
    telefono = models.CharField(max_length=16, null=True, blank=True)
    domicilio = models.ForeignKey(
        Domicilio, models.DO_NOTHING, db_column="id_domicilio", blank=True, null=True)
    adolescente = models.ForeignKey(
        Adolescente, models.DO_NOTHING, db_column="id_adolescente",
        related_name="familiares", null=True, blank=True)
    persona = models.ForeignKey(
        Persona, models.DO_NOTHING, db_column="id_persona", related_name="familiares", null=True, blank=True)

    class Meta:
        managed = False
        db_table = "familiar"



class RelacionAdolescente(models.Model):
    id = models.AutoField(primary_key=True)
    adolescente1 = models.ForeignKey(
        Adolescente, models.DO_NOTHING, db_column="id_adolescente1",
        related_name="relaciones_como_adolescente1")
    adolescente2 = models.ForeignKey(
        Adolescente, models.DO_NOTHING, db_column="id_adolescente2",
        related_name="relaciones_como_adolescente2")
    vinculo = models.ForeignKey(
        Vinculo, models.DO_NOTHING, db_column="id_vinculo")

    class Meta:
        managed = False
        db_table = "relacion_adolescente"
        constraints = [
            models.UniqueConstraint(
                fields=["adolescente1", "adolescente2", "vinculo"],
                name="relacion_adolescente_unica",
            ),
            models.CheckConstraint(
                condition=~models.Q(adolescente1=models.F("adolescente2")),
                name="relacion_adolescente_distintos",
            ),
        ]



class AdolescenteInstitucion(models.Model):
    """Instituciones de referencia informadas para un adolescente.

    La institución que presenta la solicitud vive en ``Solicitud.institucion``.
    Esta tabla sólo representa referencias de cada adolescente y no debe
    usarse como una relación de la solicitud.
    """

    id = models.AutoField(primary_key=True)
    institucion = models.ForeignKey(
        Institucion, models.DO_NOTHING, db_column="id_institucion")
    adolescente = models.ForeignKey(
        Adolescente, models.DO_NOTHING, db_column="id_adolescente", related_name="referencias_instituciones")

    class Meta:
        managed = False
        db_table = "adolescente_institucion"
        constraints = [
            models.UniqueConstraint(
                fields=["adolescente", "institucion"],
                name="adolescente_institucion_unica",
            ),
        ]

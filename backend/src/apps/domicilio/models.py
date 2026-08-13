from django.db import models

class Provincia(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)

    class Meta:
        managed = False
        db_table = 'provincia'
        ordering = ["nombre"]


class Departamento(models.Model):
    id = models.AutoField
    nombre = models.CharField(max_length=64)
    provincia = models.ForeignKey(
        Provincia, models.DO_NOTHING, db_column='id_provincia')

    class Meta:
        managed = False
        db_table = 'departamento'
        ordering = ["nombre"]


class DomicilioValidado(models.Model):
    id = models.AutoField(primary_key=True)
    codigo_calle = models.IntegerField(blank=True, null=True)
    altura = models.IntegerField()
    bis = models.BooleanField()
    letra = models.CharField(max_length=1, blank=True, null=True)
    piso = models.IntegerField(blank=True, null=True)
    depto = models.CharField(max_length=10, blank=True, null=True)
    monoblock = models.IntegerField(blank=True, null=True)
    barrio = models.CharField(max_length=128, blank=True, null=True)
    vecinal = models.CharField(max_length=128, blank=True, null=True)
    distrito = models.CharField(max_length=16, blank=True, null=True)
    seccional_policial = models.CharField(max_length=32, blank=True, null=True)
    localidad = models.CharField(max_length=128)
    coordenada_x = models.CharField(max_length=32, blank=True, null=True)
    coordenada_y = models.CharField(max_length=32, blank=True, null=True)
    fraccion_censal = models.CharField(max_length=32, blank=True, null=True)
    radio_censal = models.CharField(max_length=32, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "domicilio_validado"


class Domicilio(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=128)
    domicilio_validado = models.ForeignKey(
        DomicilioValidado, models.DO_NOTHING, db_column='id_domicilio_validado', blank=True, null=True)
    departamento = models.ForeignKey(
        Departamento, models.DO_NOTHING, db_column='id_departamento')

    class Meta:
        managed = False
        db_table = "domicilio"


class TipoInstitucion(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=32)
    
    class Meta:
        managed = False
        db_table = "tipo_institucion"


class Institucion(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)
    domicilio = models.ForeignKey(
        Domicilio, models.DO_NOTHING, db_column='id_domicilio')
    tipo = models.ForeignKey(
        TipoInstitucion, models.DO_NOTHING, db_column='id_tipo')
    telefono = models.CharField(max_length=16)
    correo = models.CharField(max_length=32)

    class Meta:
        managed = False
        db_table = "institucion"
        ordering = ["nombre"]



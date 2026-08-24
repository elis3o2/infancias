from django.db import models


class Provincia(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)

    class Meta:
        managed = False
        db_table = 'provincia'
        ordering = ["nombre"]


class Departamento(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)
    provincia = models.ForeignKey(
        Provincia, models.DO_NOTHING, db_column='id_provincia')

    class Meta:
        managed = False
        db_table = 'departamento'
        ordering = ["nombre"]


class Distrito(models.Model):
    id = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=16)
    
    class Meta:
        managed = False
        db_table = 'ditrito'


class Vecinal(models.Model):
    id = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=64)
    
    class Meta:
        managed = False
        db_table = 'vecnial'


class Barrio(models.Model):
    id = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=64)
    
    class Meta:
        managed = False
        db_table = 'barrio'


class SeccionalPolicial(models.Model):
    id = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=64)
    
    class Meta:
        managed = False
        db_table = 'seccional_policial'


class IdentidadBarrial(models.Model):
    id = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=64)
    
    class Meta:
        managed = False
        db_table = 'identidad_barrial'


class DomicilioValidado(models.Model):
    id = models.AutoField(primary_key=True)
    codigo_calle = models.IntegerField(blank=True, null=True)
    altura = models.IntegerField()
    bis = models.BooleanField()
    letra = models.CharField(max_length=1, blank=True, null=True)
    piso = models.IntegerField(blank=True, null=True)
    nombreInterseccion = models.CharField(max_length=64, blank=True, null=True)
    codigoInterseccion = models.IntegerField(blank=True, null=True)
    depto = models.CharField(max_length=10, blank=True, null=True)
    monoblock = models.IntegerField(blank=True, null=True)
    coordenada_x = models.FloatField(blank=True, null=True)
    coordenada_y = models.FloatField(blank=True, null=True)
    distrito = models.ForeignKey(
        Distrito, models.DO_NOTHING, db_column="id_distrito", blank=True, null=True)
    vecinal = models.ForeignKey(
        Vecinal, models.DO_NOTHING, db_column="id_vecinal", blank=True, null=True)
    barrio = models.ForeignKey(
        Barrio, models.DO_NOTHING, db_column="id_barrio", blank=True, null=True)
    seccional_policial = models.ForeignKey(
        SeccionalPolicial, models.DO_NOTHING, db_column="id_seccional_policial", blank=True, null=True)
    fraccion_censal = models.IntegerField(blank=True, null=True)
    zona_notificacion = models.IntegerField(blank=True, null=True)
    radio_censal = models.IntegerField(blank=True, null=True)
    identidad_barrial = models.ForeignKey(
        IdentidadBarrial, models.DO_NOTHING, db_column="id_identidad_barrial", blank=True, null=True)
    localidad = models.CharField(max_length=64, blank=True, null=True)
    puntoX = models.IntegerField(blank=True, null=True)
    puntoY = models.IntegerField(blank=True, null=True)
    latitud = models.IntegerField(blank=True, null=True)
    longitud = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "domicilio_validado"


class Domicilio(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=128)
    domicilio_validado = models.ForeignKey(
        DomicilioValidado, models.DO_NOTHING, db_column='id_domicilio_validado', blank=True, null=True)
    observaciones = models.CharField(max_length=256, null=True, blank=True)
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


    class Meta:
        managed = False
        db_table = "institucion"
        ordering = ["nombre"]
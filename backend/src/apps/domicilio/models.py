from django.db import models

class Domicilio(models.Model):
    id = models.AutoField(primary_key=True)
    calle = models.CharField(max_length=256)
    codigo_calle = models.IntegerField(blank=True, null=True)
    altura = models.IntegerField()
    bis = models.IntegerField()
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
        db_table = "domicilio"


class TipoEfector(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=16)

    class Meta:
        managed = False
        db_table = "tipo_efector"


class Efector(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=128)
    tipo = models.ForeignKey(
        TipoEfector, models.DO_NOTHING, db_column='id_tipo_efector')
    direccion = models.ForeignKey(
        Domicilio, models.DO_NOTHING, db_column='id_domicilio')

    class Meta:
        managed = False
        db_table = "efector"



class Institucion(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)
    domicilio = models.ForeignKey(
        Domicilio, models.DO_NOTHING, db_column='id_domicilio')

    class Meta:
        managed = False
        db_table = "institucion"
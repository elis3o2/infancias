from django.db import models

class Comedor(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)

    class Meta:
        managed = False
        db_table = "comedor"


class TUC(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)

    class Meta:
        managed = False
        db_table = "tuc"


class AUH(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)

    class Meta:
        managed = False
        db_table = "auh"

    
class PensionContributiva(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)

    class Meta:
        managed = False
        db_table = "pension_contributiva"


class PensionNoContributiva(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)

    class Meta:
        managed = False
        db_table = "pension_no_contributiva"


class Programa(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)

    class Meta:
        managed = False
        db_table = "programa"


class GrupoFamiliar(models.Model):
    id = models.AutoField(primary_key=True)
    comedor = models.ForeignKey(
        Comedor, models.DO_NOTHING, db_column='id_comedor')
    tuc = models.ForeignKey(
        TUC, models.DO_NOTHING, db_column='id_tuc')
    auh = models.ForeignKey(
        AUH, models.DO_NOTHING, db_column='id_auh')
    pension_cont = models.ForeignKey(
        PensionContributiva, models.DO_NOTHING, db_column='id_pension_cont')
    pension_no_cont = models.ForeignKey(
        PensionNoContributiva, models.DO_NOTHING, db_column='id_pension_no_cont')
    programa = models.ForeignKey(
        Programa, models.DO_NOTHING, db_column='id_programa')
    obra_social = models.BooleanField()

    class Meta:
        managed = False
        db_table = "grupo_familiar"
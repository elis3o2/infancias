from django.db import models
from src.apps.domicilio.models import Institucion
from src.apps.persona.models import Solicitante, Adolescente


class MotivoSolicitud(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=32)

    class Meta:
        managed = False
        db_table = 'motivo_solicitud'


class PrioridadSolicitud(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=32)

    class Meta: 
        managed = False
        db_table = 'prioridad_solicitud'


class Solicitud(models.Model):
    id = models.AutoField(primary_key=True)
    institucion = models.ForeignKey(
        Institucion, models.DO_NOTHING, db_column='id_institucion')
    solicitante = models.ForeignKey(
        Solicitante, models.DO_NOTHING, db_column='id_solicitante')
    adolescente = models.ForeignKey(
        Adolescente, models.DO_NOTHING, db_column='id_adolescente')
    motivo = models.ForeignKey(
        MotivoSolicitud, models.DO_NOTHING, db_column='id_motivo')
    prioridad = models.ForeignKey(
        PrioridadSolicitud, models.DO_NOTHING, db_column='id_prioridad')
    descripcion = models.CharField(max_length=256)
    fecha_hora_creacion = models.DateField()
    validado = models.BooleanField()
    rechazado = models.BooleanField()

    class Meta:
        managed = False
        db_table = 'solicitud'


class Archivo(models.Model):
    id = models.AutoField(primary_key=True)
    solicitud = models.ForeignKey(
        "Solicitud", models.DO_NOTHING, db_column="id_solicitud",)
    nombre = models.CharField(max_length=255)
    tipo_mime = models.CharField(max_length=100, null=True, blank=True)
    contenido = models.BinaryField()

    class Meta:
        managed = False
        db_table = "archivo"
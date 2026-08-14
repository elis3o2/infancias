from django.db import models
from src.apps.domicilio.models import Institucion
from src.apps.persona.models import Solicitante, Adolescente
from django.conf import settings


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


class Derivacion(models.Model):
    id = models.AutoField
    nombre = models.CharField(max_length=32)

    class Meta: 
        managed = False
        db_table = 'derivacion'


class Solicitud(models.Model):
    id = models.AutoField(primary_key=True)
    institucion = models.ForeignKey(
        Institucion, models.DO_NOTHING, db_column='id_institucion')
    solicitante = models.ForeignKey(
        Solicitante, models.DO_NOTHING, db_column='id_solicitante', blank=True, null=True)
    adolescente = models.ForeignKey(
        Adolescente, models.DO_NOTHING, db_column='id_adolescente')
    motivo = models.ForeignKey(
        MotivoSolicitud, models.DO_NOTHING, db_column='id_motivo')
    correo = models.CharField(max_length=32)
    telefono = models.CharField(max_length=32)
    prioridad = models.ForeignKey(
        PrioridadSolicitud, models.DO_NOTHING, db_column='id_prioridad', related_name='prioridad')
    prioridad_extra = models.ForeignKey(
        PrioridadSolicitud, models.DO_NOTHING, db_column="id_prioridad_extra", related_name='prioridad_extra', null=True, blank=True)
    descripcion = models.CharField(max_length=256)
    descripcion_extra = models.CharField(max_length=256, blank=True, null=True)
    fecha_hora_creacion = models.DateTimeField()
    fecha_hora_modificacion = models.DateTimeField(blank=True, null=True)
    validado = models.BooleanField()
    rechazado = models.BooleanField()
    motivo_rechazo = models.CharField(max_length=256, null=True, blank=True)
    derivacion = models.ForeignKey(
        Derivacion, models.DO_NOTHING, db_column="id_derivacion", null=True, blank=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, models.DO_NOTHING, db_column="id_usuario", null=True, blank=True)

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
    valido = models.BooleanField()
    extra = models.BooleanField()

    class Meta:
        managed = False
        db_table = "archivo"
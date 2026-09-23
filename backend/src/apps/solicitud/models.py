from django.db import models
from src.models import Equipo
from src.apps.domicilio.models import Institucion
from django.conf import settings


class MotivoSolicitud(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=32)

    class Meta:
        managed = False
        db_table = 'motivo_solicitud'


class Solicitud(models.Model):
    id = models.AutoField(primary_key=True)
    institucion = models.ForeignKey(
        Institucion, models.DO_NOTHING, db_column='id_institucion', null=True, blank=True)
    motivo = models.ForeignKey(
        MotivoSolicitud, models.DO_NOTHING, db_column='id_motivo')
    correo = models.CharField(max_length=32)
    telefono = models.CharField(max_length=32)
    descripcion = models.CharField(max_length=256, blank=True, default="")
    descripcion_extra = models.CharField(max_length=256, null=True, blank=True)
    fecha_hora_creacion = models.DateTimeField()
    fecha_hora_entrada = models.DateTimeField(blank=True, null=True)
    fecha_hora_admision = models.DateTimeField(blank=True, null=True)
    validado = models.BooleanField()
    rechazado = models.BooleanField()
    motivo_rechazo = models.CharField(max_length=256, null=True, blank=True)
    usuario_entrada = models.ForeignKey(
        settings.AUTH_USER_MODEL, models.DO_NOTHING, db_column="id_usuario_entrada",related_name="entrada", null=True, blank=True)
    usuario_admision = models.ForeignKey(
        settings.AUTH_USER_MODEL, models.DO_NOTHING, db_column="id_usuario_admision",related_name="admision", null=True, blank=True)
    equipo = models.ForeignKey(
        Equipo, models.DO_NOTHING, db_column="id_equipo")

    class Meta:
        managed = False
        db_table = 'solicitud'


class Archivo(models.Model):
    id = models.AutoField(primary_key=True)
    solicitud = models.ForeignKey(
        "Solicitud", models.DO_NOTHING, db_column="id_solicitud",
        related_name="archivos")
    nombre = models.CharField(max_length=255)
    tipo_mime = models.CharField(max_length=100, null=True, blank=True)
    contenido = models.BinaryField()

    class Meta:
        managed = False
        db_table = "archivo"


class SolicitudComentario(models.Model):
    id = models.AutoField(primary_key=True)
    solicitud = models.ForeignKey(
        Solicitud, models.DO_NOTHING, db_column="id_solicitud", related_name="comentarios")
    comentario = models.CharField(max_length=256)
    fecha_hora_creacion = models.DateTimeField()
    fecha_hora_ultmod = models.DateTimeField()
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, models.DO_NOTHING, db_column='id_usuario')

    class Meta:
        managed = False
        db_table = 'solicitud_comentario'


from django.db import models
from src.apps.domicilio.models import Institucion
from src.apps.habitat.models import Habitat
from src.apps.grupo_familiar.models import GrupoFamiliar
from src.apps.persona.models import Persona, Menor

class Atencion(models.Model):
    id = models.AutoField(primary_key=True)
    institucion = models.ForeignKey(
        Institucion, models.DO_NOTHING, db_column='id_institucion')
    fecha_hora_creacion = models.DateField()
    menor = models.ForeignKey(
        Menor, models.DO_NOTHING, db_column='id_menor')
    habitat = models.ForeignKey(
        Habitat, models.DO_NOTHING, db_column='id_habitat')
    grupos_familiares = models.ManyToManyField(
        'GrupoFamiliar', through='AtencionGrupoFamiliar')

    class Meta:
        managed = False
        db_table = "atencion" 


class AtencionGrupoFamiliar(models.Model):
    id = models.AutoField(primary_key=True)
    atencion = models.ForeignKey(
        Atencion, models.DO_NOTHING, db_column='id_atencion')
    grupo_familiar = models.ForeignKey(
        GrupoFamiliar, models.DO_NOTHING, db_column='id_grupo_familiar')

    class Meta:
        managed = False
        db_table = "atencion_grupo_familiar"
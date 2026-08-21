from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    equipo = models.ForeignKey(
        'src.Equipo',         
        on_delete=models.SET_NULL,  
        null=True,                  
        blank=True,
        related_name='usuarios'
    )

    def __str__(self):
        equipo_nombre = self.equipo.nombre if self.equipo else "Sin equipo"
        return f"{self.username} - {equipo_nombre}"
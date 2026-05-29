from django.urls import path, include

# src/urls.py
urlpatterns = [
    # Apps
    path("atencion/", include("src.apps.atencion.urls")),
    path("domicilio/", include("src.apps.domicilio.urls")),
    path("grupo_familiar/", include("src.apps.grupo_familiar.urls")),
    path("habitat/", include("src.apps.habitat.urls")),
    path("persona/", include("src.apps.persona.urls")),
    path("relacion/", include("src.apps.relacion.urls"))
]
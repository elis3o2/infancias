from django.urls import path, include

# src/urls.py
urlpatterns = [
    # Apps
    path("domicilio/", include("src.apps.domicilio.urls")),
    path("persona/", include("src.apps.persona.urls")),
    path("solicitud/", include("src.apps.solicitud.urls"))
]
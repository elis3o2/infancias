from django.urls import path, include

from .views import EquipoListView


urlpatterns = [
    path("equipos/", EquipoListView.as_view(), name="equipo-list"),
    path("domicilio/", include("src.apps.domicilio.urls")),
    path("persona/", include("src.apps.persona.urls")),
    path("solicitud/", include("src.apps.solicitud.urls"))
]
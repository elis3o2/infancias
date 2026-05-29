from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (PersonaViewSet, MenorViewSet, EscolaridaViewSet, CCBViewSet,
                    ObraSocialViewSet, HistoriaClinicaView, CiudadanoDataViewSet)

router = DefaultRouter()
router.register("persona", PersonaViewSet, basename="persona")
router.register("menor", MenorViewSet, basename="menor")
router.register("escolaridad", EscolaridaViewSet, basename="escolaridad")
router.register("ccb", CCBViewSet, basename="ccb")
router.register("obra_social", ObraSocialViewSet, basename="obra_social")

urlpatterns = [
    path("", include(router.urls)),
    path("historia-clinica", HistoriaClinicaView.as_view(), name="historia-clinica"),
    path("ciudadano", CiudadanoDataViewSet.as_view(), name="ciudadano")
]


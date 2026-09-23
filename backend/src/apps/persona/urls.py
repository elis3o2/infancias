from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (AdolescenteViewSet, ConsultaPersonasAPIView, FamiliarViewSet,
                    VinculoViewSer, RelacionAdolescenteViewSet)
from src.apps.api_externa.views import HistoriaClinicaAPIView

router = DefaultRouter()
router.register("adolescente", AdolescenteViewSet, basename="adolescente")
router.register("familiar", FamiliarViewSet, basename="familiar")
router.register("vinculo", VinculoViewSer, basename="vinculo")
router.register("relacion-adolescente", RelacionAdolescenteViewSet, basename="relacion-adolescente")


urlpatterns = [
    path("", include(router.urls)),
    path("historia-clinica/", HistoriaClinicaAPIView.as_view(), name="historia-clinica"),
    path("ciudadano/", ConsultaPersonasAPIView.as_view(), name="ciudadano")
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (AdolescenteViewSet, FamiliarViewSet, VinculoViewSer, HistoriaClinicaView, CiudadanoDataViewSet, )

router = DefaultRouter()
router.register("adolescente", AdolescenteViewSet)
router.register("familiar", FamiliarViewSet)
router.register("vinculo", VinculoViewSer)


urlpatterns = [
    path("", include(router.urls)),
    path("historia-clinica", HistoriaClinicaView.as_view(), name="historia-clinica"),
    path("ciudadano", CiudadanoDataViewSet.as_view(), name="ciudadano")
]


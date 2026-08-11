from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (AdolescenteViewSet, SolicitanteViewSet, FamiliarViewSet, VinculoViewSer,
                HermanoViewSet, HistoriaClinicaView, CiudadanoDataViewSet, AdolescenteValidadoViewSet, HermanoValidadoViewSet)

router = DefaultRouter()
router.register("adolescente", AdolescenteViewSet)
router.register("solicitante", SolicitanteViewSet)
router.register("familiar", FamiliarViewSet)
router.register("hermano", HermanoViewSet)
router.register("vinculo", VinculoViewSer)
router.register("adolescente_validado", AdolescenteValidadoViewSet)
router.register("hermano_validado", HermanoValidadoViewSet)


urlpatterns = [
    path("", include(router.urls)),
    path("historia-clinica", HistoriaClinicaView.as_view(), name="historia-clinica"),
    path("ciudadano", CiudadanoDataViewSet.as_view(), name="ciudadano")
]


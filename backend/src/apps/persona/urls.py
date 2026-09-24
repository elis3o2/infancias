from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (AdolescenteViewSet, ConsultaPersonasAPIView, FamiliarViewSet,
                    VinculoViewSer, RelacionAdolescenteViewSet)

router = DefaultRouter()
router.register("adolescente", AdolescenteViewSet, basename="adolescente")
router.register("familiar", FamiliarViewSet, basename="familiar")
router.register("vinculo", VinculoViewSer, basename="vinculo")
router.register("relacion-adolescente", RelacionAdolescenteViewSet, basename="relacion-adolescente")


urlpatterns = [
    path("", include(router.urls)),
    path("ciudadano/", ConsultaPersonasAPIView.as_view(), name="ciudadano")
]

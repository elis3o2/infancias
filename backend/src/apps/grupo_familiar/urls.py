from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (ComedorViewSet, TUCViewSet, AUHViewSet, PensionContributivaViewSet,
                    PensionNoContributivaViewSet, GrupoFamiliarViewSet)

router = DefaultRouter()
router.register("comedor", ComedorViewSet, basename="comedor")
router.register("tuc", TUCViewSet, basename="tuc")
router.register("auh", AUHViewSet, basename="auh")
router.register("pension_contributiva", PensionContributivaViewSet, basename="pension_contributiva")
router.register("pension_no_contributiva", PensionNoContributivaViewSet, basename="pension_no_contributiva")
router.register("grupo_familiar", GrupoFamiliarViewSet, basename="grupo_familiar")

urlpatterns = [
    path("", include(router.urls)),
]


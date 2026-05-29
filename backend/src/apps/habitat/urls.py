from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (TenenciaViewSet, MaterialViewSet, HabitatViewSet)

router = DefaultRouter()
router.register("tenencia", TenenciaViewSet, basename="tenencia")
router.register("material", MaterialViewSet, basename="material")
router.register("habitat", HabitatViewSet, basename="habitat")

urlpatterns = [
    path("", include(router.urls))
]
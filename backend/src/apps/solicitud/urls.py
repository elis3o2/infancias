from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import MotivoSolicitudViewSet, PrioridadSolicitudViewSet, SolicitudViewSet


router = DefaultRouter()
router.register("motivo_solicitud", MotivoSolicitudViewSet)
router.register("prioridad_solicitud", PrioridadSolicitudViewSet)
router.register("solicitud", SolicitudViewSet)

urlpatterns = [
    path("", include(router.urls))
]



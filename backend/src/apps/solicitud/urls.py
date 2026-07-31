from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MotivoSolicitudViewSet, PrioridadSolicitudViewSet, SolicitudViewSet


router = DefaultRouter()
router.register("motivo", MotivoSolicitudViewSet)
router.register("prioridad", PrioridadSolicitudViewSet)
router.register("solicitud", SolicitudViewSet)

urlpatterns = [
    path("", include(router.urls)),
]



from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MotivoSolicitudViewSet, PrioridadSolicitudViewSet, SolicitudViewSet, ArchivoViewSet


router = DefaultRouter()
router.register("motivo", MotivoSolicitudViewSet)
router.register("prioridad", PrioridadSolicitudViewSet)
router.register("solicitud", SolicitudViewSet)
router.register("archivo", ArchivoViewSet)
urlpatterns = [
    path("", include(router.urls)),
]



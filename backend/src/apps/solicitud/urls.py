from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MotivoSolicitudViewSet, SolicitudViewSet, ArchivoViewSet


router = DefaultRouter()
router.register("motivo", MotivoSolicitudViewSet, basename="motivo")
router.register("solicitud", SolicitudViewSet, basename="solicitud")
router.register("archivo", ArchivoViewSet, basename="archivo")
urlpatterns = [
    path("", include(router.urls)),
]



from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MotivoSolicitudViewSet, PrioridadSolicitudViewSet, SolicitudViewSet, SubirArchivoView


router = DefaultRouter()
router.register("motivo", MotivoSolicitudViewSet)
router.register("prioridad", PrioridadSolicitudViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("archivo/subir/",SubirArchivoView.as_view())
]



from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import InstruccionViewSet, OcupacionViewSet, TipoRelacionViewSet, RelacionViewSet


router = DefaultRouter()
router.register("instruccion", InstruccionViewSet, basename="instruccion")
router.register("ocupacion", OcupacionViewSet, basename="ocupacion")
router.register("tipo_relacion", TipoRelacionViewSet, basename="tipo_relacion")
router.register("relacion", RelacionViewSet, basename="relacion")

urlpatterns = [
    path("", include(router.urls))
]



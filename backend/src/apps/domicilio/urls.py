from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (InstitucionViewSet, TipoEfector, Efector, GeoDataViewSet)

router = DefaultRouter()
router.register("institucion", InstitucionViewSet, basename="institucion")
router.register("tipo_efector", TipoEfector, basename="tipo_efector")
router.register("efector", Efector, basename="efector")
router.register("geolocalizacion", GeoDataViewSet, basename="geolocalizacion")

urlpatterns = [
    path("", include(router.urls))
]
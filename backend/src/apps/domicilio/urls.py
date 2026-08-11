from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (ProvinciaViewSet, DepartamentoViewSet, InstitucionViewSet, TipoInstitucionViewSet, DomicilioViewSet,
                    GeoDataViewSet)

router = DefaultRouter()
router.register("provincia", ProvinciaViewSet, basename='provincia')
router.register("departamento", DepartamentoViewSet, basename='departamento')
router.register("institucion", InstitucionViewSet, basename='institucion')
router.register("tipo_institucion", TipoInstitucionViewSet, basename='tipo_institucion')
router.register("domicilio", DomicilioViewSet,basename='domicilio')
router.register("geolocalizacion", GeoDataViewSet, basename='geolocalizacion')



urlpatterns = [
    path("", include(router.urls))
]


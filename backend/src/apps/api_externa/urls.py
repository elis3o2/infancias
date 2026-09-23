from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CiudadanoAPIView, GeoDataViewSet, HistoriaClinicaAPIView


router = DefaultRouter()
router.register(
    "geolocalizacion",
    GeoDataViewSet,
    basename="externa-geolocalizacion",
)


urlpatterns = [
    path("", include(router.urls)),
    path("ciudadano/", CiudadanoAPIView.as_view(), name="ciudadano"),
    path(
        "historia-clinica/",
        HistoriaClinicaAPIView.as_view(),
        name="historia-clinica",
    ),
]

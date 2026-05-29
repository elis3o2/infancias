from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AtencionViewSet


router = DefaultRouter()
router.register("atencion", AtencionViewSet, basename="atencion")


urlpatterns = [
    path("", include(router.urls))
]
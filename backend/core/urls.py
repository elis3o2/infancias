from django.urls import path, include, re_path
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from src.views import frontend

api_patterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("", include("src.urls")),
]

urlpatterns = [
    path("", RedirectView.as_view(url="/casainfancias/buscar", permanent=False)),
    path("api/", include(api_patterns)),
    path("casainfancias/api/", include((api_patterns, "infancias_api"))),
    path("casainfancias", RedirectView.as_view(url="/casainfancias/buscar", permanent=False)),
    path("casainfancias/", RedirectView.as_view(url="/casainfancias/buscar", permanent=False)),
    re_path(r"^casainfancias/(?!(?:api|assets)(?:/|$))[^.]*$", frontend),
]

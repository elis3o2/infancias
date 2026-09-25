from django.urls import path, include, re_path
from django.views.generic import TemplateView # O tu vista 'frontend'
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from src.views import frontend

urlpatterns = [
    path('infancias/api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('infancias/api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("infancias/api/", include("src.urls")),

    re_path(r"^infancias/", frontend), 
]


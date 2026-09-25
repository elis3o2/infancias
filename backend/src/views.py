from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import render

from .models import Equipo
from .serializers import EquipoSerializer


def frontend(request):
    return render(request, "index.html")


class EquipoListView(generics.ListAPIView):
    serializer_class = EquipoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Equipo.objects.exclude(
            id__in=[1, 2]
        ).order_by("nombre")

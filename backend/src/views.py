from rest_framework import generics

from .models import Equipo
from .serializers import EquipoSerializer


class EquipoListView(generics.ListAPIView):
    serializer_class = EquipoSerializer

    def get_queryset(self):
        return Equipo.objects.exclude(
            id__in=[1, 2]
        ).order_by("nombre")
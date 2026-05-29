from rest_framework import viewsets
from .models import Tenencia, Material, Habitat
from .serializers import TenenciaSerializer, MaterialSerializer, HabitatSerializer
from src.permissions import ReadOnly

class TenenciaViewSet(viewsets.ModelViewSet):
    queryset = Tenencia.objects.all()
    serializer_class = TenenciaSerializer
    permission_classes = [ReadOnly]


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [ReadOnly]


class HabitatViewSet(viewsets.ModelViewSet):
    queryset = Habitat.objects.all()
    serializer_class = HabitatSerializer
    permission_classes = [ReadOnly]

    
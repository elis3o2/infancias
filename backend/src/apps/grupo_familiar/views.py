from rest_framework import viewsets
from .models import Comedor, TUC, AUH, PensionContributiva, PensionNoContributiva, Programa, GrupoFamiliar
from .serializers import (ComedorSerializer, TUCSerializer, TUCSerializer, AUHSerializer, PensionContributivaSerializer,
                    PensionNoContributivaSerializer, ProgramaSerializer, GrupoFamiliarSerializer)
from src.permissions import ReadOnly


class ComedorViewSet(viewsets.ModelViewSet):
    queryset = Comedor.objects.all()
    serializer_class = ComedorSerializer
    permissions_classes = [ReadOnly]


class TUCViewSet(viewsets.ModelViewSet):
    queryset = TUC.objects.all()
    serializer_class = TUCSerializer
    permissions_classes = [ReadOnly]


class AUHViewSet(viewsets.ModelViewSet):
    queryset = AUH.objects.all()
    serializer_class = AUHSerializer
    permissions_classes = [ReadOnly]


class PensionContributivaViewSet(viewsets.ModelViewSet):
    queryset = PensionContributiva.objects.all()
    serializer_class = PensionContributivaSerializer
    permissions_classes = [ReadOnly]


class PensionNoContributivaViewSet(viewsets.ModelViewSet):
    queryset = PensionNoContributiva.objects.all()
    serializer_class = PensionNoContributivaSerializer
    permissions_classes = [ReadOnly]


class GrupoFamiliarViewSet(viewsets.ModelViewSet):
    queryset = GrupoFamiliar.objects.all()
    serializer_class = GrupoFamiliarSerializer



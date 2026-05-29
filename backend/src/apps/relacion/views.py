from rest_framework import viewsets
from .models import Instruccion, Ocupacion, TipoRelacion, Relacion
from .serializers import InstruccionSerializer, OcupacionSerializer, TipoRelacionSerializer, RelacionSerializer
from src.permissions import ReadOnly

class InstruccionViewSet(viewsets.ModelViewSet):
    queryset = Instruccion.objects.all()
    serializer_class = InstruccionSerializer
    permission_classes = [ReadOnly]

class OcupacionViewSet(viewsets.ModelViewSet):
    queryset = Ocupacion.objects.all()
    serializer_class = OcupacionSerializer
    permission_classes = [ReadOnly]


class TipoRelacionViewSet(viewsets.ModelViewSet):
    queryset = TipoRelacion.objects.all()
    serializer_class = TipoRelacionSerializer
    permission_classes = [ReadOnly]


class RelacionViewSet(viewsets.ModelViewSet):
    queryset = Relacion.objects.all()
    serializer_class = RelacionSerializer 



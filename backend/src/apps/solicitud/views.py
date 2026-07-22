from rest_framework import viewsets
from .models import PrioridadSolicitud, MotivoSolicitud, Solicitud
from .serializers import PrioridadSolicitudSerializer, MotivoSolicitudSerializer, SolicitudSerializer
from src.permissions import ReadOnly

class PrioridadSolicitudViewSet(viewsets.ModelViewSet):
    queryset = PrioridadSolicitud.objects.all()
    serializer_class = PrioridadSolicitudSerializer
    permission_classes = [ReadOnly]

class MotivoSolicitudViewSet(viewsets.ModelViewSet):
    queryset = MotivoSolicitud.objects.all()
    serializer_class = MotivoSolicitudSerializer
    permission_classes = [ReadOnly]

class SolicitudViewSet(viewsets.ModelViewSet):
    queryset = Solicitud.objects.all()
    serializer_class = SolicitudSerializer

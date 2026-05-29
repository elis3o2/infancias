from rest_framework import viewsets
from .models import Atencion
from .serializers import AtencionSerializer

class AtencionViewSet(viewsets.ModelViewSet):
    queryset = Atencion.objects.all()
    serializer_class = AtencionSerializer


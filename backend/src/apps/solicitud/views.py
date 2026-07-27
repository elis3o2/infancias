from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import PrioridadSolicitud, MotivoSolicitud, Solicitud, Archivo
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

class SubirArchivoView(APIView):

    def post(self, request):
        archivo = request.FILES.get("archivo")
        id_solicitud = request.data.get("id_solicitud")

        if not archivo:
            return Response(
                {"error": "No se envió archivo"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not id_solicitud:
            return Response(
                {"error": "Falta id_solicitud"},
                status=status.HTTP_400_BAD_REQUEST
            )

        nuevo_archivo = Archivo.objects.create(
            solicitud_id=id_solicitud,
            nombre=archivo.name,
            tipo_mime=archivo.content_type,
            contenido=archivo.read()
        )

        return Response(
            {
                "id": nuevo_archivo.id,
                "nombre": nuevo_archivo.nombre,
                "tipo_mime": nuevo_archivo.tipo_mime,
            },
            status=status.HTTP_201_CREATED
        )
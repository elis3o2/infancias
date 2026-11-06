from django.db.models import Count, Prefetch
from src.apps.persona.models import Adolescente
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from src.permissions import IsOperationalUser
from .reportes import fecha_actual, periodo_reporte, resumen_filtrado, resumen_general, solicitudes_reporte
from .reportes_serializers import FiltrosReporteSerializer, SolicitudReporteSerializer


class ReportesSolicitudAPIView(APIView):
    permission_classes = [IsOperationalUser]
    http_method_names = ["get", "head", "options"]

    def get(self, request):
        filtros = FiltrosReporteSerializer(data=request.query_params)
        filtros.is_valid(raise_exception=True)
        hoy = fecha_actual()
        desde, hasta = periodo_reporte(filtros.validated_data, hoy)
        consulta = solicitudes_reporte(filtros.validated_data, desde, hasta)
        paginador = PageNumberPagination()
        paginador.page_size = 20
        pagina = paginador.paginate_queryset(consulta.select_related("equipo", "motivo").annotate(
            cantidad_adolescentes=Count("adolescentes", distinct=True),
            cantidad_comentarios=Count("comentarios", distinct=True),
        ).prefetch_related(Prefetch("adolescentes", queryset=Adolescente.objects.select_related(
            "persona__legajo__carpeta",
        ).order_by("id"))).order_by("-fecha_hora_creacion", "-id"), request)
        return Response({
            "general": resumen_general(hoy),
            "periodo": {"desde": desde, "hasta": hasta},
            "resumen": resumen_filtrado(consulta),
            "solicitudes": {
                "pagina": paginador.page.number,
                "count": paginador.page.paginator.count,
                "next": paginador.get_next_link(),
                "previous": paginador.get_previous_link(),
                "results": SolicitudReporteSerializer(pagina, many=True).data,
            },
        })

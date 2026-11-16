"""Adaptador DRF de la política de acceso de solicitudes."""
from rest_framework.permissions import BasePermission

from .services import puede_ejecutar_accion


class SolicitudPermission(BasePermission):
    def has_permission(self, request, view):
        return puede_ejecutar_accion(request.user, view.action)

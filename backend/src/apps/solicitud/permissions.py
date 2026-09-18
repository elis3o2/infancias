from rest_framework.permissions import BasePermission

from src.permissions import usuario_tiene_rol


class SolicitudPermission(BasePermission):

    def has_permission(self, request, view):

        # Crear es público
        if view.action == "create":
            return True

        # Todo lo demás requiere autenticación
        if not request.user.is_authenticated:
            return False

        es_entrada = usuario_tiene_rol(request.user, "entrada")
        es_guardia = usuario_tiene_rol(request.user, "guardia")
        es_admision = usuario_tiene_rol(request.user, "admision")
        es_territorial = usuario_tiene_rol(request.user, "territorial")

        # Entrada puede leer, modificar, validar y rechazar
        if es_entrada:
            return view.action in [
                "list",
                "retrieve",
                "validar",
                "rechazar",
                "comentar",
                "sin_validar",
                "validados",
                "rechazados",
            ]

        # Guardia mantiene acceso de lectura; admisión puede derivar las
        # solicitudes que ya fueron enviadas a su equipo.
        if es_guardia or es_admision or es_territorial:
            acciones = [
                "list",
                "retrieve",
                "validados",
                "comentar",
            ]
            if es_admision:
                acciones.append("derivar")
            return view.action in acciones

        return False

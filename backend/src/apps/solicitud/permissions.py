from rest_framework.permissions import BasePermission


class SolicitudPermission(BasePermission):

    def has_permission(self, request, view):

        # Crear es público
        if view.action == "create":
            return True

        # Todo lo demás requiere autenticación
        if not request.user.is_authenticated:
            return False

        es_entrada = request.user.groups.filter(name="entrada").exists()
        es_guardia = request.user.groups.filter(name="guardia").exists()
        es_admision = request.user.groups.filter(name="admision").exists()

        # Entrada puede leer, modificar, validar y rechazar
        if es_entrada:
            return view.action in [
                "list",
                "retrieve",
                "update",
                "partial_update",
                "validar",
                "rechazar",
                "sin_validar",
                "validados",
                "rechazados",
            ]

        # Guardia y admisión solamente lectura
        if es_guardia or es_admision:
            return view.action in [
                "list",
                "retrieve",
                "validados",
            ]

        return False
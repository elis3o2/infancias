from rest_framework.permissions import BasePermission

from src.permissions import usuario_tiene_rol
from .constantes import ID_ADMISION, ID_ENTRADA


def puede_registrar_situaciones(usuario) -> bool:
    return bool(
        usuario and usuario.is_authenticated
        and usuario.equipo_id in {ID_ENTRADA, ID_ADMISION}
        and (usuario_tiene_rol(usuario, "entrada") or usuario_tiene_rol(usuario, "admision"))
    )


def puede_gestionar_admision(solicitud, usuario) -> bool:
    return bool(
        usuario and usuario.is_authenticated
        and usuario.equipo_id == ID_ADMISION
        and solicitud.equipo_id == ID_ADMISION
        and solicitud.validado and not solicitud.rechazado
    )


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

        if view.action in {"comentar", "editar_comentario"}:
            return puede_registrar_situaciones(request.user)

        if view.action in {"agregar_familiar", "agregar_adolescente"}:
            return es_admision

        # Entrada puede leer, modificar, validar y rechazar
        if es_entrada:
            return view.action in [
                "list",
                "retrieve",
                "validar",
                "rechazar",
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
            ]
            if es_admision:
                acciones.append("derivar")
            return view.action in acciones

        return False

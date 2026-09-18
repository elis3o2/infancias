from unicodedata import combining, normalize

from rest_framework.permissions import BasePermission, SAFE_METHODS


_EQUIPOS_COMPATIBLES_POR_ROL = {
    "entrada": {"entrada"},
    "admision": {"admision"},
    "territorial": {"territorial"},
    # Guardia no tiene un equipo equivalente en el catálogo actual.
    "guardia": set(),
}


def _normalizar_nombre(valor: str) -> str:
    return "".join(
        caracter for caracter in normalize("NFKD", valor) if not combining(caracter)
    ).casefold()


def usuario_tiene_rol(user, rol: str) -> bool:
    """Resuelve roles nuevos por grupo y usuarios históricos por equipo.

    Las instalaciones iniciales asignaban únicamente un equipo a los usuarios
    de Entrada, Admisión y Territorial. Mantener esa equivalencia evita que
    esos usuarios reciban 403 tras habilitar los permisos por grupo.
    """
    if not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_superuser", False):
        return True
    if user.groups.filter(name=rol).exists():
        return True
    if not getattr(user, "equipo_id", None):
        return False

    equipo = getattr(user, "equipo", None)
    nombre_equipo = _normalizar_nombre(getattr(equipo, "nombre", ""))
    return nombre_equipo in _EQUIPOS_COMPATIBLES_POR_ROL.get(rol, set())


class IsOperationalUser(BasePermission):
    """Requires an authenticated member of an operational team.

    Endpoints that expose people, case files or stored addresses must not be
    available merely because an account has a team assigned. The same group
    names are used by the request workflow permission.
    """

    message = "Se requiere pertenecer a un equipo operativo."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not getattr(user, "is_authenticated", False):
            return False

        if not getattr(user, "equipo_id", None):
            return False

        return any(
            usuario_tiene_rol(user, rol)
            for rol in ("entrada", "guardia", "admision", "territorial")
        )


class ReadOnly(BasePermission):

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS

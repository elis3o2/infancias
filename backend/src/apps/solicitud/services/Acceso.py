"""Políticas de acceso a solicitudes, independientes del adaptador HTTP."""
from django.db.models import Q

from src.permissions import usuario_tiene_rol
from ..constantes import ID_ADMISION, ID_ENTRADA


def puede_seguir_solicitudes(usuario) -> bool:
    return bool(
        usuario and usuario.is_authenticated
        and usuario.equipo_id in {ID_ENTRADA, ID_ADMISION}
        and (usuario_tiene_rol(usuario, "entrada") or usuario_tiene_rol(usuario, "admision"))
    )


def puede_registrar_situaciones(usuario) -> bool:
    return bool(
        puede_seguir_solicitudes(usuario)
        and usuario.equipo_id == ID_ADMISION
        and usuario_tiene_rol(usuario, "admision")
    )


def puede_agregar_familiares(solicitud, usuario) -> bool:
    return bool(
        puede_seguir_solicitudes(usuario)
        and solicitud.validado and not solicitud.rechazado
    )


def puede_gestionar_admision(solicitud, usuario) -> bool:
    return bool(
        usuario and usuario.is_authenticated
        and usuario.equipo_id == ID_ADMISION
        and solicitud.equipo_id == ID_ADMISION
        and solicitud.validado and not solicitud.rechazado
    )


def puede_ejecutar_accion(usuario, accion: str) -> bool:

    # Crear es público
    if accion == "create":
        return True

    # Todo lo demás requiere autenticación
    if not usuario.is_authenticated:
        return False

    es_entrada = usuario_tiene_rol(usuario, "entrada")
    es_guardia = usuario_tiene_rol(usuario, "guardia")
    es_admision = usuario_tiene_rol(usuario, "admision")
    es_territorial = usuario_tiene_rol(usuario, "territorial")

    if accion in {"comentar", "editar_comentario"}:
        return puede_registrar_situaciones(usuario)

    if accion == "agregar_familiar":
        return puede_seguir_solicitudes(usuario)

    if accion == "agregar_adolescente":
        return es_admision

    # Entrada puede leer, modificar, validar y rechazar
    if es_entrada:
        return accion in [
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
        return accion in acciones

    return False


def filtrar_solicitudes_visibles(queryset, usuario, accion: str):
    if not usuario.is_authenticated or not getattr(usuario, "equipo_id", None):
        return queryset.none()
    seguimiento = {"list", "validados", "retrieve", "comentar", "editar_comentario", "agregar_familiar"}
    if accion in seguimiento and puede_seguir_solicitudes(usuario):
        return queryset.filter(Q(equipo_id=usuario.equipo_id) | Q(validado=True, rechazado=False))
    return queryset.filter(equipo_id=usuario.equipo_id)

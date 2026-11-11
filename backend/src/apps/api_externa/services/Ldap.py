"""Autenticación LDAP sin proxy y con el contrato booleano Login."""
from typing import cast
from decouple import config
from ..types import ServicioExternoError
from ..utils import _como_objeto, _obtener_json, _url_configurada


def consultar_ldap(user: str, key: str) -> bool:
    """Consulta LDAP sin proxy; ``key`` es la contraseña del usuario."""
    data = _como_objeto(_obtener_json(
        _url_configurada("LDAP_API_URL"),
        params={"user": user, "password": key},
        headers={"LDAP_API_KEY": config("LDAP_API_KEY")},
    ))
    if data is None or not isinstance(data.get("Login"), bool):
        raise ServicioExternoError("El servicio LDAP devolvió una respuesta inesperada.")
    return cast(bool, data["Login"])

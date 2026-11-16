"""Adaptador de la API externa de autenticación."""

import logging

import requests
from decouple import config

logger = logging.getLogger(__name__)


def autenticar_ldap(username: str, password: str) -> bool:
    with requests.Session() as session:
        session.trust_env = False
        try:
            respuesta = session.get(
                config("LDAP_API_URL"),
                headers={"LDAP_API_KEY": config("LDAP_API_KEY")},
                params={"user": username, "password": password},
                timeout=5,
            )
            respuesta.raise_for_status()
            datos = respuesta.json()
        except (requests.RequestException, ValueError):
            # La URL de una excepción de requests puede contener la contraseña.
            logger.warning("La API externa de autenticación no respondió correctamente.")
            return False
    return isinstance(datos, dict) and datos.get("Login") is True

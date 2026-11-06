"""Configuración editable en backend/.env, sin secretos en el código."""

from dataclasses import dataclass
from pathlib import Path
from typing import Literal, cast
from urllib.parse import urlsplit

from decouple import config

from .types import ServicioExternoNoConfigurado

BACKEND_DIR = Path(__file__).resolve().parents[3]


@dataclass(frozen=True, slots=True)
class ConfiguracionIdentidad:
    url: str
    clave: str
    certificado: Path
    metodo: Literal["GET", "POST"]
    usar_proxy: bool
    archivo_limites: Path


def _ruta(valor: str) -> Path:
    ruta = Path(valor).expanduser()
    return ruta if ruta.is_absolute() else BACKEND_DIR / ruta


def cargar_configuracion() -> ConfiguracionIdentidad:
    url = config("API_RNP", default=config("IDENTIDAD_API_URL", default="https://192.168.64.50:8533/v1/consulta")).strip()
    partes = urlsplit(url)
    if partes.scheme != "https" or not partes.hostname or partes.username or partes.password or partes.query or partes.fragment:
        raise ServicioExternoNoConfigurado("API_RNP (o IDENTIDAD_API_URL) debe ser HTTPS y no incluir credenciales ni parámetros.")
    clave = config("IDENTIDAD_API_KEY", default="").strip()
    if not clave:
        raise ServicioExternoNoConfigurado("Falta configurar IDENTIDAD_API_KEY.")
    certificado = _ruta(config("API_RNP_CA_PATH", default=config("IDENTIDAD_CA_CERT", default="certs/app1-identidad.crt")).strip())
    if not certificado.is_file():
        raise ServicioExternoNoConfigurado("API_RNP_CA_PATH (o IDENTIDAD_CA_CERT) debe apuntar al certificado CA existente.")
    metodo = config("IDENTIDAD_HTTP_METHOD", default="POST").strip().upper()
    if metodo not in {"GET", "POST"}:
        raise ServicioExternoNoConfigurado("IDENTIDAD_HTTP_METHOD debe ser GET o POST.")
    archivo = config("IDENTIDAD_RATE_LIMIT_FILE", default="var/identidad-limites.json").strip()
    if not archivo:
        raise ServicioExternoNoConfigurado("Falta configurar IDENTIDAD_RATE_LIMIT_FILE.")
    return ConfiguracionIdentidad(
        url=url, clave=clave, certificado=certificado,
        metodo=cast(Literal["GET", "POST"], metodo),
        usar_proxy=config("IDENTIDAD_USE_PROXY", default=False, cast=bool),
        archivo_limites=_ruta(archivo),
    )

"""Integración con API_RNP: configuración, cuota compartida, consulta y normalización.

La cuota persiste entre workers y solo guarda tiempos, nunca datos personales.
La consulta independiente conserva el JSON; consultar_renaper lo adapta para
Infancias sin crear personas ni consultar la API de historia clínica familiar.
"""

import fcntl
import json
import logging
import math
import os
import tempfile
import time
from collections.abc import Iterator, Sequence
from contextlib import contextmanager
from datetime import date, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Literal, cast
from urllib.parse import urlsplit

import requests
from decouple import config

from ..clases import (
    Ciudadano, ConfiguracionIdentidad, ConsultaIdentidad, DatosDigitalizacion,
    DatosPersonaRNP, DatosSisrosRNP, EstadoLimites, IdentidadHTTPError,
    IdentidadLimiteExcedido, IdentidadRespuestaParcial, IdentidadRevisionRequerida,
    JsonObject, JsonValue, ResultadoIdentidad, SeccionIdentidad,
    ServicioExternoError, ServicioExternoNoConfigurado, SexoIdentidad,
)
from ..utils import TIMEOUT_EXTERNO

logger = logging.getLogger(__name__)
BACKEND_DIR = Path(__file__).resolve().parents[4]

CONSULTAS_POR_MINUTO = 2
CONSULTAS_POR_DIA = 48
INTERVALO_CONSULTAS = 3
# Conservar estados anteriores al cambio de cuota, sin reiniciar su consumo.
MAX_REGISTROS_HISTORICOS = 10000


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


def _leer(archivo: Path) -> EstadoLimites:
    if not archivo.exists():
        return EstadoLimites([])
    datos: object = json.loads(archivo.read_text(encoding="utf-8"))
    if not isinstance(datos, dict):
        raise ValueError("Estado inválido")
    consultas = datos.get("consultas")
    bloqueo = datos.get("bloqueado_hasta")
    if not isinstance(consultas, list) or len(consultas) > MAX_REGISTROS_HISTORICOS:
        raise ValueError("Estado inválido")
    for valor in [*consultas, bloqueo]:
        if type(valor) not in (float, int) or not math.isfinite(valor) or valor < 0:
            raise ValueError("Estado inválido")
    if consultas != sorted(consultas):
        raise ValueError("Estado inválido")
    return EstadoLimites([float(valor) for valor in consultas], float(bloqueo))


def _guardar(archivo: Path, estado: EstadoLimites) -> None:
    temporal: str | None = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=archivo.parent, delete=False) as salida:
            temporal = salida.name
            json.dump({"consultas": estado.consultas, "bloqueado_hasta": estado.bloqueado_hasta}, salida)
            salida.flush()
            os.fsync(salida.fileno())
        os.replace(temporal, archivo)
    finally:
        if temporal is not None and os.path.exists(temporal):
            os.unlink(temporal)


def _reservar(estado: EstadoLimites, ahora: float) -> None:
    # Ventana móvil de 24 horas: conservadora frente a un cupo por día calendario.
    estado.consultas = [fecha for fecha in estado.consultas if fecha > ahora - 86400]
    disponible = estado.bloqueado_hasta
    if estado.consultas:
        disponible = max(disponible, estado.consultas[-1] + INTERVALO_CONSULTAS)
    minuto = [fecha for fecha in estado.consultas if fecha > ahora - 60]
    if len(minuto) >= CONSULTAS_POR_MINUTO:
        disponible = max(disponible, minuto[-CONSULTAS_POR_MINUTO] + 60)
    if len(estado.consultas) >= CONSULTAS_POR_DIA:
        # Si el estado anterior supera la nueva cuota, esperar hasta que queden 47.
        disponible = max(disponible, estado.consultas[-CONSULTAS_POR_DIA] + 86400)
    if disponible > ahora:
        raise IdentidadLimiteExcedido(math.ceil(disponible - ahora))
    estado.consultas.append(ahora)
    estado.bloqueado_hasta = ahora + INTERVALO_CONSULTAS


@contextmanager
def limitar_consulta(archivo: Path) -> Iterator[EstadoLimites]:
    try:
        archivo.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        descriptor = os.open(str(archivo) + ".lock", os.O_CREAT | os.O_RDWR, 0o600)
        with os.fdopen(descriptor, "a") as bloqueo:
            try:
                fcntl.flock(bloqueo, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                raise IdentidadLimiteExcedido(INTERVALO_CONSULTAS) from None
            try:
                estado = _leer(archivo)
                _reservar(estado, time.time())
                _guardar(archivo, estado)  # Contar incluso timeout o caída del worker.
                try:
                    yield estado
                finally:
                    # También separar tres segundos después de una consulta lenta.
                    estado.consultas[-1] = max(estado.consultas[-1], time.time())
                    estado.pausar(INTERVALO_CONSULTAS)
                    _guardar(archivo, estado)
            finally:
                fcntl.flock(bloqueo, fcntl.LOCK_UN)
    except (OSError, ValueError) as exc:
        # Nunca continuar sin cuota si el archivo está dañado o no es escribible.
        raise ServicioExternoError("No se pudo verificar el límite compartido de Identidad.") from exc


def _consulta(dni: str, sexo: SexoIdentidad, secciones: Sequence[SeccionIdentidad] | None) -> ConsultaIdentidad:
    if not isinstance(dni, str) or not dni.strip() or not dni.strip().isascii() or not dni.strip().isdigit():
        raise ValueError("El DNI debe ser un texto con dígitos.")
    if sexo not in ("F", "M", "X"):
        raise ValueError("El sexo debe ser F, M o X.")
    datos: ConsultaIdentidad = {"dni": dni.strip(), "sexo": sexo}
    if secciones is not None:
        if isinstance(secciones, str) or not secciones or any(s not in ("renaper", "puco", "sisros") for s in secciones):
            raise ValueError("Las secciones permitidas son renaper, puco y sisros.")
        datos["secciones"] = list(dict.fromkeys(secciones))
    if sexo == "X":
        if secciones is None:
            # Omitir secciones pediría también PUCO, que no admite X.
            raise ValueError("Para sexo X indicá las secciones explícitamente, sin puco.")
        if "puco" in secciones:
            raise ValueError("PUCO no admite sexo X.")
    return datos


def _retry_after(valor: str | None) -> int:
    if valor:
        valor = valor.strip()
        if valor.isascii() and valor.isdigit():
            return max(3, int(valor))
        try:
            fecha = parsedate_to_datetime(valor)
            if fecha.tzinfo is None:
                fecha = fecha.replace(tzinfo=timezone.utc)
            return max(3, math.ceil(fecha.timestamp() - time.time()))
        except (TypeError, ValueError, OverflowError):
            pass
    return 60  # Espera conservadora si el proveedor no informa un valor válido.


def consultar_identidad(
    dni: str,
    sexo: SexoIdentidad,
    secciones: Sequence[SeccionIdentidad] | None = None,
) -> ResultadoIdentidad:
    """Devuelve el JSON sin normalizar; 207 no significa validación completa.

    No reintenta ni cambia de método automáticamente. Los consumidores deben
    revisar cada bloque, y tratar 409 como revisión humana obligatoria.
    """
    datos = _consulta(dni, sexo, secciones)
    configuracion = cargar_configuracion()
    with limitar_consulta(configuracion.archivo_limites) as limite:
        try:
            with requests.Session() as session:
                session.trust_env = configuracion.usar_proxy
                respuesta = session.request(
                    configuracion.metodo,
                    configuracion.url,
                    json=datos,
                    headers={"X-API-Key": configuracion.clave, "Accept": "application/json"},
                    verify=str(configuracion.certificado),
                    timeout=TIMEOUT_EXTERNO,
                    allow_redirects=False,
                )
        except requests.exceptions.SSLError as exc:
            raise ServicioExternoError("No se pudo verificar el certificado TLS de Identidad.") from exc
        except requests.RequestException as exc:
            raise ServicioExternoError("No fue posible conectar con Identidad.") from exc

        codigo = respuesta.status_code
        if codigo == 409:
            raise IdentidadRevisionRequerida()
        if codigo == 429:
            segundos = _retry_after(respuesta.headers.get("Retry-After"))
            limite.pausar(segundos)
            raise IdentidadLimiteExcedido(segundos, remoto=True)
        if codigo in (401, 403):
            raise IdentidadHTTPError(codigo, "La clave de Identidad es inválida o no autoriza las secciones solicitadas.")
        if codigo in (502, 503, 504):
            raise IdentidadHTTPError(codigo, "Una fuente de Identidad no está disponible.")
        if codigo not in (200, 207):
            raise IdentidadHTTPError(codigo, f"Identidad respondió con HTTP {codigo}.")
        try:
            cuerpo: object = respuesta.json()
        except ValueError as exc:
            raise ServicioExternoError("Identidad devolvió un JSON inválido.") from exc
        if not isinstance(cuerpo, dict):
            raise ServicioExternoError("Identidad no devolvió un objeto JSON.")
        return ResultadoIdentidad(codigo_http=codigo, datos=cast(JsonObject, cuerpo))


def _numero_historia(valor: JsonValue) -> str | None:
    if isinstance(valor, bool) or not isinstance(valor, int) or valor <= 0:
        return None
    return str(valor)


def _historias_sisros(respuesta: JsonObject) -> tuple[str | None, str | None]:
    bloque = respuesta.get("sisros")
    if not isinstance(bloque, dict) or bloque.get("estado") != "ok":
        return None, None
    coincidencia = bloque.get("match")
    if (
        not isinstance(coincidencia, dict)
        or coincidencia.get("estado") != "VALIDADO_EXACTO"
        or coincidencia.get("vinculado") is not True
    ):
        return None, None
    datos = bloque.get("datos")
    if not isinstance(datos, dict):
        return None, None
    historias = cast(DatosSisrosRNP, datos)
    return _numero_historia(historias.get("numero_hci")), _numero_historia(historias.get("numero_hcf"))


def normalizar_identidad(resultado: ResultadoIdentidad, dni: str, sexo: str) -> DatosDigitalizacion:
    bloque = resultado.datos.get("persona")
    if not isinstance(bloque, dict):
        raise ServicioExternoError("API_RNP no devolvió el bloque de persona.")
    datos = bloque.get("datos")
    if isinstance(datos, dict) and datos.get("requiere_revision") is True:
        raise IdentidadRevisionRequerida()
    if bloque.get("estado") != "ok":
        if resultado.parcial:
            raise IdentidadRespuestaParcial()
        raise ServicioExternoError("API_RNP no pudo verificar los datos de la persona.")
    if not isinstance(datos, dict) or datos.get("requiere_revision") is not False:
        raise ServicioExternoError("API_RNP no informó si la identidad requiere revisión.")

    for campo in ("dni", "sexo", "apellido", "nombres", "fecha_nacimiento"):
        valor = datos.get(campo)
        if not isinstance(valor, str) or not valor.strip():
            raise ServicioExternoError("API_RNP no informó todos los datos de identidad requeridos.")

    persona = cast(DatosPersonaRNP, datos)
    documento = persona["dni"].strip()
    if not documento.isascii() or not documento.isdigit():
        raise ServicioExternoError("API_RNP devolvió un documento inválido.")
    if int(documento) != int(dni) or persona["sexo"] != sexo:
        raise ServicioExternoError("API_RNP devolvió datos que no coinciden con la consulta.")
    try:
        nacimiento = date.fromisoformat(persona["fecha_nacimiento"])
        if nacimiento.isoformat() != persona["fecha_nacimiento"]:
            raise ValueError("Formato de fecha no válido")
    except ValueError as exc:
        raise ServicioExternoError("API_RNP devolvió una fecha de nacimiento inválida.") from exc

    ciudadano = Ciudadano(
        nombre=persona["nombres"].strip(), apellido=persona["apellido"].strip(),
        nroDocumento=int(documento), sexo=persona["sexo"],
        fechaNacimiento=nacimiento.isoformat(),
    )
    hc, hcf = _historias_sisros(resultado.datos)
    respuesta: DatosDigitalizacion = {**ciudadano.como_dict(), "hc": hc}
    if hcf is not None:
        respuesta["hcf"] = hcf
    return respuesta


def _consultar_identidad_respaldo(dni: str, sexo: str) -> ResultadoIdentidad:
    try:
        secciones: list[SeccionIdentidad] = ["renaper", "sisros"] if sexo == "X" else ["renaper", "puco", "sisros"]
        try:
            return consultar_identidad(dni, cast(SexoIdentidad, sexo), secciones=secciones)
        except IdentidadLimiteExcedido as exc:
            if exc.remoto or exc.reintentar_en > 3:
                raise
            # Consultas consecutivas del mismo formulario: esperar el intervalo
            # local una sola vez. No reintentar una petición HTTP ya enviada.
            time.sleep(exc.reintentar_en)
            return consultar_identidad(dni, cast(SexoIdentidad, sexo), secciones=secciones)
    except ValueError as exc:
        raise ServicioExternoError("Los datos de consulta no son válidos para Identidad.") from exc


def consultar_renaper(dni: str, sexo: str) -> DatosDigitalizacion | None:
    """Devuelve la identidad con HC/HCF; un 404 deja la persona sin validar."""
    try:
        respaldo = _consultar_identidad_respaldo(dni, sexo)
    except IdentidadHTTPError as exc:
        if exc.codigo_http != 404:
            raise
        # Sin identidad validada; no interrumpir la consulta de las otras personas.
        logger.info("Identidad respondió HTTP 404; la persona queda sin validar.")
        return None
    return normalizar_identidad(respaldo, dni, sexo)

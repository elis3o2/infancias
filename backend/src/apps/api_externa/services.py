"""Clientes para las integraciones HTTP ajenas al dominio de Infancias.

Las aplicaciones de dominio consumen estas funciones, pero no conocen detalles
de URLs, credenciales ni de la forma de las respuestas de cada proveedor.
"""

import logging
from typing import cast
from urllib.parse import quote

import requests
from decouple import config

from .types import (
    AntecedentesHistoriaClinica,
    ArchivosAdjuntos,
    CabecerasHTTP,
    Ciudadano,
    CoordenadaEntrada,
    DatosDigitalizacion,
    DestinatariosCorreo,
    DireccionGeografica,
    FeatureGeografico,
    JsonArray,
    JsonObject,
    JsonValue,
    ParametrosConsulta,
    RespuestaCorreo,
    RespuestaDigitalizacion,
)


logger = logging.getLogger(__name__)
TIMEOUT_EXTERNO = 10


class ServicioExternoError(RuntimeError):
    """La integración remota no pudo completar la operación."""


class ServicioExternoNoConfigurado(ServicioExternoError):
    """Falta la URL o credencial necesaria para una integración."""


class RecursoExternoNoEncontrado(ServicioExternoError):
    """El proveedor respondió que el recurso consultado no existe."""


def _url_configurada(nombre: str) -> str:
    url = config(nombre, default="").strip()
    if not url:
        raise ServicioExternoNoConfigurado(
            f"El servicio externo {nombre} no está configurado."
        )
    return url


def _obtener_json(
    url: str,
    *,
    params: ParametrosConsulta | None = None,
    headers: CabecerasHTTP | None = None,
) -> JsonValue:
    """Hace un GET directo, sin heredar proxies del entorno de ejecución."""
    try:
        with requests.Session() as session:
            session.trust_env = False
            response = session.get(
                url,
                params=params,
                headers=headers,
                timeout=TIMEOUT_EXTERNO,
            )
    except requests.RequestException as exc:
        raise ServicioExternoError("No fue posible conectar con el servicio externo.") from exc

    if response.status_code == 404:
        raise RecursoExternoNoEncontrado()

    try:
        response.raise_for_status()
    except requests.RequestException as exc:
        raise ServicioExternoError(
            f"El servicio externo respondió con HTTP {response.status_code}."
        ) from exc

    try:
        return cast(JsonValue, response.json())
    except ValueError as exc:
        raise ServicioExternoError(
            "El servicio externo devolvió una respuesta inválida."
        ) from exc


def _como_objeto(valor: JsonValue | None) -> JsonObject | None:
    return valor if isinstance(valor, dict) else None


def _como_lista(valor: JsonValue | None) -> JsonArray | None:
    return valor if isinstance(valor, list) else None


def _como_texto(valor: JsonValue | None) -> str | None:
    return valor if isinstance(valor, str) else None


def _como_coordenada(valor: JsonValue) -> CoordenadaEntrada | None:
    if isinstance(valor, bool):
        return None
    if isinstance(valor, (str, int, float)):
        return valor
    return None


def _consultar_api_digitalizacion(dni: str, sexo: str) -> RespuestaDigitalizacion:
    data = _obtener_json(
        _url_configurada("API_DIGITALIZACION"),
        params={
            "api_key": config("KEY_DIGITALIZACION", default=""),
            "documento": dni,
            "sexo": sexo,
        },
    )
    if _como_objeto(data) is None:
        raise ServicioExternoError(
            "El servicio de historia clínica devolvió una respuesta inesperada."
        )
    return cast(RespuestaDigitalizacion, data)


def consultar_digitalizacion(dni: str, sexo: str) -> DatosDigitalizacion | None:
    """Consulta ciudadano y conserva ``None`` para ausencia o caída remota.

    El contrato de las pantallas existentes interpreta ``None`` como datos no
    disponibles, nunca como un rechazo automático de la solicitud.
    """
    if not sexo:
        return None

    try:
        data = _consultar_api_hc(dni=dni, sexo=sexo)
    except RecursoExternoNoEncontrado:
        logger.info("No se encontraron datos de ciudadano para la consulta.")
        return None
    except ServicioExternoNoConfigurado:
        logger.warning("La consulta de ciudadano no está configurada.")
        return None
    except ServicioExternoError as exc:
        logger.warning("No fue posible consultar el servicio de ciudadano: %s", exc)
        return None

    sisa_data = _como_objeto(data.get("sisa_data")) or {}

    def contiene_identidad(valor: JsonValue | None) -> bool:
        objeto = _como_objeto(valor)
        return objeto is not None and any(
            objeto.get(campo) not in (None, "")
            for campo in (
                "nombre",
                "nombres",
                "apellido",
                "apellidos",
                "nroDocumento",
                "dni",
                "documento",
                "fechaNacimiento",
            )
        )

    ciudadano = next(
        (
            candidato
            for candidato in (
                data.get("ciudadano"),
                sisa_data.get("ciudadano"),
                sisa_data,
                data,
            )
            if contiene_identidad(candidato)
        ),
        None,
    )
    if ciudadano is None:
        logger.info("El servicio de ciudadano no informó datos de identidad.")
        return None

    results_query1 = _como_lista(data.get("results_query1")) or []

    fecha_nacimiento = (
        ciudadano.get("fechaNacimiento") or ciudadano.get("fecha_nacimiento")
    )
    nro_documento = (
        ciudadano.get("nroDocumento")
        or ciudadano.get("dni")
        or ciudadano.get("documento")
        or dni
    )
    hcf = ciudadano.get("hcf") or ciudadano.get("hc") or next(
        (
            item.get("hc")
            for item in (_como_objeto(valor) for valor in results_query1)
            if item is not None and item.get("hc")
        ),
        None,
    )

    return {
        "nombre": _como_texto(ciudadano.get("nombre")) or _como_texto(ciudadano.get("nombres")),
        "apellido": _como_texto(ciudadano.get("apellido")) or _como_texto(ciudadano.get("apellidos")),
        "sexo": _como_texto(ciudadano.get("sexo")),
        "fechaNacimiento": fecha_nacimiento,
        "nroDocumento": nro_documento,
        # Alias que utilizan los consumidores internos actuales.
        "fecha_nacimiento": fecha_nacimiento,
        "hcf": hcf,
        "adscripcion": list(
            dict.fromkeys(
                item.get("adscripcion")
                for item in (_como_objeto(valor) for valor in results_query1)
                if item is not None and item.get("adscripcion")
            )
        ),
        "fallecido": ciudadano.get("fallecido"),
    }



def consultar_historia_clinica(
    dni: str,
    sexo: str,
) -> AntecedentesHistoriaClinica:
    """Devuelve los antecedentes resumidos de la respuesta de API_HC."""
    data = _consultar_api_hc(dni=dni, sexo=sexo)
    query_1 = _como_lista(data.get("results_query1")) or []
    query_2 = _como_lista(data.get("results_query2")) or []
    sisa_data = _como_objeto(data.get("sisa_data")) or {}
    coberturas = _como_lista(sisa_data.get("coberturas")) or []

    return {
        "adscripcion": [
            item.get("adscripcion")
            for item in (_como_objeto(valor) for valor in query_1)
            if item is not None and item.get("adscripcion")
        ],
        "efectores": list(
            dict.fromkeys(
                item.get("efector")
                for item in (_como_objeto(valor) for valor in query_2)
                if item is not None and item.get("efector")
            )
        ),
        "obra_social": list(
            dict.fromkeys(
                item.get("nombreObraSocial")
                for item in (_como_objeto(valor) for valor in coberturas)
                if item is not None and item.get("nombreObraSocial")
            )
        ),
    }


def consultar_hcf(hcf: int | str) -> JsonValue | None:
    """Consulta integrantes de una historia clínica familiar si existe."""
    try:
        return _obtener_json(
            _url_configurada("API_HCF"),
            params={"hcf": hcf},
            headers={"HCF_PPVV_API_KEY": config("HCF_PPVV_API_KEY", default="")},
        )
    except RecursoExternoNoEncontrado:
        return None
    except ServicioExternoNoConfigurado:
        logger.warning("La consulta HCF no está configurada.")
        return None
    except ServicioExternoError as exc:
        logger.warning("No fue posible consultar la historia clínica familiar: %s", exc)
        return None


def consultar_ciudadano(dni: str, sexo: str) -> Ciudadano | None:
    """Consulta Ciudadano manteniendo habilitado el proxy del entorno."""
    url = config("API_CIUDADANO", default="").strip()
    api_key = config("KEY_CIUDADANO", default="")

    if not url:
        logger.warning("La consulta de ciudadano no está configurada.")
        return None

    try:
        response = requests.get(
            url,
            params={"dni": dni, "sexo": sexo, "api_key": api_key},
            timeout=TIMEOUT_EXTERNO,
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        data = cast(JsonValue, response.json())
    except (requests.RequestException, ValueError):
        logger.warning("No fue posible consultar el servicio de ciudadano.")
        return None

    respuesta = _como_objeto(data)
    ciudadano = _como_objeto(respuesta.get("ciudadano")) if respuesta else None
    if ciudadano is None:
        logger.warning("El servicio de ciudadano devolvió una respuesta inesperada.")
        return None

    nombre = _como_texto(ciudadano.get("nombre"))
    apellido = _como_texto(ciudadano.get("apellido"))
    sexo_ciudadano = _como_texto(ciudadano.get("sexo"))
    fecha_nacimiento = _como_texto(ciudadano.get("fechaNacimiento"))
    nro_documento = ciudadano.get("nroDocumento")

    if (
        not nombre
        or not apellido
        or not sexo_ciudadano
        or not fecha_nacimiento
        or isinstance(nro_documento, bool)
        or not isinstance(nro_documento, int)
    ):
        logger.warning("El servicio de ciudadano no informó todos los datos requeridos.")
        return None

    return Ciudadano(
        nombre=nombre,
        apellido=apellido,
        nroDocumento=nro_documento,
        sexo=sexo_ciudadano,
        fechaNacimiento=fecha_nacimiento,
    )


def transformar_coordenadas(
    x: CoordenadaEntrada,
    y: CoordenadaEntrada,
) -> tuple[float, float]:
    try:
        from pyproj import Transformer
    except ImportError as exc:
        raise ServicioExternoError(
            "No está disponible la conversión de coordenadas geográficas."
        ) from exc
    transformer = Transformer.from_crs("epsg:22185", "epsg:4326", always_xy=True)
    longitud, latitud = transformer.transform(x, y)
    return latitud, longitud


def buscar_features_geo(domicilio: str) -> list[FeatureGeografico]:
    """Busca direcciones y normaliza el GeoJSON de API_GEO1."""
    base_url = _url_configurada("API_GEO1")
    data = _obtener_json(f"{base_url}{quote(domicilio, safe='')}")
    respuesta = _como_objeto(data)
    if respuesta is None:
        raise ServicioExternoError("API_GEO1 devolvió una respuesta inesperada.")

    features = _como_lista(respuesta.get("features")) or []

    resultado: list[FeatureGeografico] = []
    for valor_feature in features:
        feature = _como_objeto(valor_feature)
        if feature is None:
            continue
        geometry = _como_objeto(feature.get("geometry"))
        properties = _como_objeto(feature.get("properties"))
        if geometry is None or properties is None:
            continue
        if geometry.get("type") != "Point" or "nombreCalle" not in properties:
            continue
        coordinates = _como_lista(geometry.get("coordinates"))
        if coordinates is None or len(coordinates) < 2:
            continue
        coordenada_x = _como_coordenada(coordinates[0])
        coordenada_y = _como_coordenada(coordinates[1])
        if coordenada_x is None or coordenada_y is None:
            continue
        try:
            latitud, longitud = transformar_coordenadas(coordenada_x, coordenada_y)
        except (TypeError, ValueError):
            continue

        resultado.append(
            {
                "altura": properties.get("altura"),
                "bis": properties.get("bis"),
                "codigoCalle": properties.get("codigoCalle"),
                "codigoInterseccion": properties.get("codigoInterseccion"),
                "id": str(properties.get("id")),
                "letra": properties.get("letra"),
                "name": properties.get("name"),
                "nombreCalle": properties.get("nombreCalle"),
                "nombreInterseccion": properties.get("nombreInterseccion"),
                "coordenada_x": coordenada_x,
                "coordenada_y": coordenada_y,
                "longitud": longitud,
                "latitud": latitud,
            }
        )
    return resultado


def _numero(valor: JsonValue | None) -> int | None:
    try:
        return int(valor)
    except (TypeError, ValueError):
        return None


def normalizar_direccion_geo(data: JsonObject) -> DireccionGeografica:
    """Traduce las divisiones administrativas de API_GEO2 al contrato local."""
    resultado: DireccionGeografica = {
        "distrito": None,
        "vecinal": None,
        "barrio": None,
        "seccional_policial": None,
        "fraccion_sensal": None,
        "radio_sensal": None,
        "zona_notificacion": None,
        "identidad_barrial": None,
        "localidad": data.get("localidad"),
        "puntoX": data.get("puntoX"),
        "puntoY": data.get("puntoY"),
    }
    divisiones = _como_lista(data.get("divsAdmins")) or []
    for valor_division in divisiones:
        division = _como_objeto(valor_division)
        if division is None:
            continue
        tipo = _como_texto(division.get("nombreTipo"))
        codigo = _numero(division.get("codigo"))
        if codigo is None:
            continue
        if tipo == "Distrito":
            resultado["distrito"] = {
                "id": codigo,
                "nombre": division.get("valor"),
            }
        elif tipo == "Vecinal":
            resultado["vecinal"] = {
                "id": codigo,
                "nombre": division.get("valor"),
            }
        elif tipo == "Barrio":
            resultado["barrio"] = {
                "id": codigo,
                "nombre": division.get("valor"),
            }
        elif tipo == "Seccional Policial":
            resultado["seccional_policial"] = {
                "id": codigo,
                "nombre": division.get("valor"),
            }
        elif tipo == "Identidad Barrial":
            resultado["identidad_barrial"] = {
                "id": codigo,
                "nombre": division.get("valor"),
            }
        elif tipo == "Fracción Censal":
            resultado["fraccion_sensal"] = codigo
        elif tipo == "Radio Censal":
            resultado["radio_sensal"] = codigo
    return resultado


def obtener_direccion_geo(
    *,
    codigo_calle: int | str,
    altura: int | str,
    bis: bool | str,
    letra: str | None = None,
) -> DireccionGeografica:
    params: ParametrosConsulta = {
        "idCalle": codigo_calle,
        "altura": altura,
        "bis": bis,
    }
    if letra:
        params["letra"] = letra
    data = _obtener_json(_url_configurada("API_GEO2"), params=params)
    respuesta = _como_objeto(data)
    if respuesta is None:
        raise ServicioExternoError("API_GEO2 devolvió una respuesta inesperada.")
    return normalizar_direccion_geo(respuesta)


def obtener_latitud_longitud_geo(
    punto_x: float | str,
    punto_y: float | str,
) -> JsonValue:
    base_url = _url_configurada("API_GEO3")
    url = f"{base_url}{quote(str(punto_x), safe='')}/{quote(str(punto_y), safe='')}/"
    return _obtener_json(url)


def enviar_correo(
    subject: str,
    body: str,
    to_emails: DestinatariosCorreo,
    attachments: ArchivosAdjuntos | None = None,
) -> RespuestaCorreo:
    """Envía correo mediante API_EMAIL sin registrar datos sensibles."""
    data: list[tuple[str, str]] = [
        ("from_email", config("FROM_EMAIL", default="")),
        ("subject", subject),
        ("body", body),
    ]
    data.extend(("to_emails", email) for email in to_emails)

    files: list[tuple[str, tuple[str, bytes, str]]] = []
    for archivo in attachments or []:
        files.append(
            (
                "attachment",
                (
                    archivo.name,
                    archivo.read(),
                    getattr(archivo, "content_type", "application/octet-stream"),
                ),
            )
        )

    try:
        with requests.Session() as session:
            session.trust_env = False
            response = session.post(
                _url_configurada("API_EMAIL"),
                data=data,
                files=files,
                timeout=30,
            )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise ServicioExternoError("No fue posible enviar el correo.") from exc

    try:
        result = cast(JsonValue, response.json())
    except ValueError as exc:
        raise ServicioExternoError("API_EMAIL devolvió una respuesta no válida.") from exc
    respuesta = _como_objeto(result)
    if respuesta is None:
        raise ServicioExternoError("API_EMAIL devolvió una respuesta inesperada.")
    if respuesta.get("error"):
        raise ServicioExternoError("API_EMAIL informó un error al enviar el correo.")
    return respuesta

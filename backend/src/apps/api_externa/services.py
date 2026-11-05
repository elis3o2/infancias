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
    ArchivosAdjuntos,
    Ciudadano,
    CoordenadaEntrada,
    DatosCiudadano,
    DatosDigitalizacion,
    DestinatariosCorreo,
    DireccionGeografica,
    FeatureGeografico,
    HCFResponse,
    JsonObject,
    JsonValue,
    ParametrosConsulta,
    RespuestaCorreo,
    RespuestaDigitalizacion,
    ServicioExternoError,
    ServicioExternoNoConfigurado,
    RecursoExternoNoEncontrado
)

from .utils import (
    TIMEOUT_EXTERNO,
    _como_coordenada,
    _como_lista,
    _como_objeto,
    _como_texto,
    _numero,
    _obtener_json,
    _url_configurada,
)

logger = logging.getLogger(__name__)



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
            "El servicio de digitalización devolvió una respuesta inesperada."
        )
    return cast(RespuestaDigitalizacion, data)


def consultar_digitalizacion(dni: str, sexo: str) -> DatosDigitalizacion | None:
    """Identidad de sisa_data.ciudadano y HC de results_query1[0].hc."""
    if not sexo:
        return None

    try:
        data = _consultar_api_digitalizacion(dni=dni, sexo=sexo)
    except RecursoExternoNoEncontrado:
        logger.info("No se encontraron datos de digitalización para la consulta.")
        return None
    except ServicioExternoNoConfigurado:
        logger.warning("La consulta de digitalización no está configurada.")
        return None
    except ServicioExternoError as exc:
        logger.warning("No fue posible consultar el servicio de digitalización: %s", exc)
        return None

    sisa_data = data.get("sisa_data")
    datos_ciudadano = sisa_data.get("ciudadano") if isinstance(sisa_data, dict) else None
    resultados = data.get("results_query1")
    if not isinstance(datos_ciudadano, dict):
        logger.warning("Digitalización no informó las secciones requeridas.")
        return None

    ciudadano = _crear_ciudadano(cast(DatosCiudadano, datos_ciudadano))
    hc = None
    if isinstance(resultados, list) and resultados and isinstance(resultados[0], dict):
        hc = _como_texto(resultados[0].get("hc"))
    if ciudadano is None:
        logger.warning("Digitalización no informó todos los datos requeridos.")
        return None
    return {**ciudadano.como_dict(), "hc": hc}



def consultar_hcf(hcf: int | str) -> HCFResponse | None:
    """Consulta la HCF y sus integrantes a partir de una HC individual."""
    try:
        data = _obtener_json(
            _url_configurada("API_HCF"),
            params={"hcf": hcf},
            headers={"HCF_PPVV_API_KEY": config("HCF_PPVV_API_KEY", default="")},
        )
        respuesta = _como_objeto(data)
        if (
            respuesta is None
            or not isinstance(respuesta.get("hcf"), str)
            or not isinstance(respuesta.get("resultados"), list)
        ):
            raise ServicioExternoError("API_HCF devolvió una respuesta inesperada.")
        return cast(HCFResponse, respuesta)
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

    resultado = _crear_ciudadano(cast(DatosCiudadano, ciudadano))
    if resultado is None:
        logger.warning("El servicio de ciudadano no informó todos los datos requeridos.")
    return resultado


def _crear_ciudadano(ciudadano: DatosCiudadano) -> Ciudadano | None:
    """Crea la identidad sólo con los cinco campos exactos del contrato."""
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
        return None

    return Ciudadano(
        nombre=nombre,
        apellido=apellido,
        nroDocumento=nro_documento,
        sexo=sexo_ciudadano,
        fechaNacimiento=fecha_nacimiento,
    )


"""

APIS GEOGRAFICAS

"""

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

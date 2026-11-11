"""Contratos geográficos y conversión de coordenadas de los proveedores."""
from urllib.parse import quote
from ..types import CoordenadaEntrada, DireccionGeografica, FeatureGeografico, JsonObject, JsonValue, ParametrosConsulta, ServicioExternoError
from ..utils import _como_coordenada, _como_lista, _como_objeto, _como_texto, _numero, _obtener_json, _url_configurada


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

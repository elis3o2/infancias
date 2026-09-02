"""
Migración de "Lugares de interés" (Rosario) -> tablas institucion / domicilio / domicilio_validado

Flujo por cada fila del CSV:
    1. Extraer teléfono (primer bloque numérico) y determinar id_tipo (Salud=2 / Otra=4)
    2. Llamar a la API interna "features" (tu endpoint que envuelve API_GEO1) pasando
       la dirección TAL CUAL viene del PDF (ej: "COCHABAMBA 2010")
       -> si no devuelve resultados: la fila queda PENDIENTE, no se crea nada
       -> si devuelve varios: se usa el primero
    3. Con properties.codigoCalle / altura / bis / letra, llamar a la API interna
       "direccion" (tu endpoint que envuelve API_GEO2) para obtener distrito, barrio,
       vecinal, seccional_policial, fracción y radio censal
    4. Resolver (get-or-create) distrito / vecinal / barrio / seccional_policial /
       identidad_barrial contra sus tablas catálogo, obteniendo los IDs (FKs)
    5. INSERT en domicilio_validado (usando los IDs resueltos, no los nombres)
    6. INSERT en domicilio (nombre = properties.name de la API 1)
    7. INSERT en institucion

Requiere un archivo .env (ver .env.example) con las URLs de tus endpoints Django
y los datos de conexión a MariaDB.

Instalar dependencias:
    pip install requests python-decouple mysql-connector-python pyproj
"""
from pyproj import Transformer

import csv
import re
import sys
from decimal import Decimal, InvalidOperation

import requests
from decouple import config
import mysql.connector
from mysql.connector import Error as MySQLError

# --------------------------------------------------------------------------
# Configuración
# --------------------------------------------------------------------------

# Endpoints de TU backend Django (los que envuelven API_GEO1 / API_GEO2),
# no las APIs municipales directamente -- así reutilizamos el filtrado por
# geometry.type == "Point", la transformación de coordenadas y el manejo de 404
# que ya tenés implementado.
FEATURES_URL = "https://ws.rosario.gob.ar/ubicaciones/public/geojson/ubicaciones/all/all/"   # ej: https://tu-backend/api/geo/features
DIRECCION_URL = "https://ws.rosario.gob.ar/ubicaciones/public/direccion"  # ej: https://tu-backend/api/geo/direccion

DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = "Ch4c4l3s"
DB_NAME = "infancias"
DB_PORT = 3306

CSV_PATH = "listado.csv"

ID_TIPO_SALUD = 2
ID_TIPO_OTRA = 4
ID_DEPARTAMENTO = 520
LOCALIDAD = "Rosario"

REQUEST_TIMEOUT = 15

TELEFONO_RE = re.compile(r"\d{7,12}")

PENDIENTES_PATH = "log_pendientes.csv"
ERRORES_PATH = "log_errores.csv"

# Tablas catálogo a las que hay que resolver (get-or-create) antes de insertar
# en domicilio_validado. Mapeo: nombreTipo (de la API GEO2) -> tabla / columna FK.
CATALOGOS = {
    "Distrito": "distrito",
    "Vecinal": "vecinal",
    "Barrio": "barrio",
    "Seccional Policial": "seccional_policial",
    "Identidad Barrial": "identidad_barrial",
}


def transformar_coordenadas(x, y):
    transformer = Transformer.from_crs("epsg:22185", "epsg:4326", always_xy=True)
    lon, lat = transformer.transform(x, y)
    return [lat, lon]


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def extraer_telefono(raw: str | None) -> str | None:
    """Devuelve el primer bloque de 7 a 12 dígitos encontrado, o None."""
    if not raw:
        return None
    m = TELEFONO_RE.search(raw)
    return m.group(0) if m else None


def id_tipo_para(clasificacion: str) -> int:
    return ID_TIPO_SALUD if (clasificacion or "").strip().lower() == "salud" else ID_TIPO_OTRA


def to_decimal(value) -> Decimal | None:
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


def bis_a_string(bis) -> str:
    """Replica el comportamiento esperado por tu endpoint 'direccion': bis como 'true'/'false'."""
    return "true" if bool(bis) else "false"


def letra_a_query(letra) -> str:
    """Mismo criterio que tu función Python: si letra es '' no se agrega el parámetro."""
    letra = letra or ""
    return "" if letra == "" else f"&letra={letra}"


# --------------------------------------------------------------------------
# Llamadas a las APIs (a través de TU backend)
# --------------------------------------------------------------------------

def geo1_buscar_domicilio(direccion: str) -> dict | None:
    """
    Busca una dirección en GEO1 y devuelve la primera feature válida
    con las coordenadas transformadas.

    Equivalente a la función features() del servicio Django.
    """
    url = f"{FEATURES_URL}{direccion}"

    try:
        response = requests.get(
            url,
            timeout=REQUEST_TIMEOUT,
            proxies={"http": None, "https": None},
            verify=True,
        )

        if response.status_code == 404:
            return None

        response.raise_for_status()

        data = response.json()
        result = data.get("features", [])

        # Filtrar solamente features Point que tengan nombreCalle
        result = [
            f
            for f in result
            if (
                f.get("geometry") is not None
                and f["geometry"].get("type") == "Point"
                and "nombreCalle" in f.get("properties", {})
            )
        ]

        # Transformar coordenadas
        for feature in result:
            coordinates = feature["geometry"].get("coordinates")
            if coordinates and len(coordinates) >= 2:
                x, y = coordinates
                lat, lon = transformar_coordenadas(x, y)
                feature["geometry"]["coordinates"] = [lat, lon]

        return result[0] if result else None

    except requests.RequestException as exc:
        print(f"ERROR GEO1: {direccion} -> {exc}")
        return None


def geo2_obtener_divisiones(codigo_calle, altura, bis, letra) -> list[dict]:
    """
    Llama al endpoint 'direccion' con los datos obtenidos de GEO1.
    Equivalente al endpoint direccion() de Django.

    Devuelve la lista divsAdmins tal como la entrega la API.
    """
    bis_str = bis_a_string(bis)

    url = (
        f"{DIRECCION_URL}"
        f"?idCalle={codigo_calle}"
        f"&altura={altura}"
        f"&bis={bis_str}"
    )

    # Django agrega letra solamente si letra != ""
    if letra != "":
        url += f"&letra={letra}"

    try:
        resp = requests.get(
            url,
            timeout=REQUEST_TIMEOUT,
            proxies={"http": None, "https": None},
            verify=True,
        )

        if resp.status_code == 404:
            return []

        resp.raise_for_status()

        data = resp.json()

        if isinstance(data, dict):
            return data.get("divsAdmins", [])

        return data

    except requests.RequestException as exc:
        print(
            f"ERROR GEO2: "
            f"codigoCalle={codigo_calle}, "
            f"altura={altura}, "
            f"bis={bis_str}, "
            f"letra={letra!r} -> {exc}"
        )
        return []


def valor_div(divs: list[dict], nombre_tipo: str) -> str | None:
    for d in divs:
        if d.get("nombreTipo") == nombre_tipo:
            return d.get("valor")
    return None


# --------------------------------------------------------------------------
# Resolución de catálogos (get-or-create)
# --------------------------------------------------------------------------

def resolver_id_catalogo(cursor, cache, tabla: str, nombre: str | None) -> int | None:
    """
    Busca 'nombre' en la tabla catálogo indicada; si no existe lo inserta.
    Usa un cache en memoria (dict) para no repetir SELECTs dentro de la misma corrida.
    'tabla' siempre proviene de CATALOGOS (valores fijos definidos en este archivo),
    nunca de input externo, así que es seguro interpolarla en el SQL.
    """
    if not nombre:
        return None

    nombre = nombre.strip()
    if not nombre:
        return None

    key = (tabla, nombre)
    if key in cache:
        return cache[key]

    cursor.execute(f"SELECT id FROM {tabla} WHERE nombre = %s", (nombre,))
    row = cursor.fetchone()
    if row:
        id_ = row[0]
    else:
        cursor.execute(f"INSERT INTO {tabla} (nombre) VALUES (%s)", (nombre,))
        id_ = cursor.lastrowid

    cache[key] = id_
    return id_


def resolver_fks_desde_divs(cursor, cache, divs: list[dict]) -> dict:
    """
    Dado el listado divsAdmins de GEO2, resuelve (get-or-create) los IDs de
    distrito / vecinal / barrio / seccional_policial / identidad_barrial.
    Devuelve un dict {"id_distrito": ..., "id_vecinal": ..., ...}
    """
    resultado = {}
    for nombre_tipo, tabla in CATALOGOS.items():
        valor = valor_div(divs, nombre_tipo)
        columna = f"id_{tabla}"
        resultado[columna] = resolver_id_catalogo(cursor, cache, tabla, valor)
    return resultado


# --------------------------------------------------------------------------
# Inserts
# --------------------------------------------------------------------------

def insertar_domicilio_validado(cursor, *, codigo_calle, altura, bis, letra,
                                 fks, coordenada_x, coordenada_y,
                                 fraccion_censal, radio_censal) -> int:
    # letra es CHAR(1) NULL en la tabla: nos quedamos solo con el primer carácter
    letra_db = (letra or "")[:1] or None

    # altura es NOT NULL: si GEO1 no la devolvió, no podemos insertar el domicilio_validado
    if altura is None:
        raise ValueError("altura es requerida (NOT NULL) y GEO1 no la devolvió")

    cursor.execute(
        """
        INSERT INTO domicilio_validado
            (codigo_calle, altura, bis, letra,
             id_distrito, id_vecinal, id_barrio, id_seccional_policial,
             id_identidad_barrial, localidad,
             coordenada_x, coordenada_y, fraccion_censal, radio_censal)
        VALUES
            (%s, %s, %s, %s,
             %s, %s, %s, %s,
             %s, %s,
             %s, %s, %s, %s)
        """,
        (
            codigo_calle, altura, int(bool(bis)), letra_db,
            fks.get("id_distrito"), fks.get("id_vecinal"), fks.get("id_barrio"),
            fks.get("id_seccional_policial"), fks.get("id_identidad_barrial"),
            LOCALIDAD,
            to_decimal(coordenada_x), to_decimal(coordenada_y),
            fraccion_censal, radio_censal,
        ),
    )
    return cursor.lastrowid


def insertar_domicilio(cursor, *, nombre, id_domicilio_validado) -> int:
    cursor.execute(
        """
        INSERT INTO domicilio (nombre, id_domicilio_validado, id_departamento)
        VALUES (%s, %s, %s)
        """,
        (nombre, id_domicilio_validado, ID_DEPARTAMENTO),
    )
    return cursor.lastrowid


def insertar_institucion(cursor, *, nombre, id_domicilio, id_tipo, telefono):
    cursor.execute(
        """
        INSERT INTO institucion (nombre, id_domicilio, id_tipo)
        VALUES (%s, %s, %s)
        """,
        (nombre, id_domicilio, id_tipo),
    )
    return cursor.lastrowid


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main():
    with open(CSV_PATH, encoding="utf-8") as f:
        filas = list(csv.DictReader(f))

    print(f"Filas a procesar: {len(filas)}")

    cnx = mysql.connector.connect(
        host=DB_HOST, user=DB_USER, password=DB_PASSWORD,
        database=DB_NAME, port=DB_PORT,
    )
    cursor = cnx.cursor()

    # cache de catálogos {(tabla, nombre): id} para no repetir SELECT/INSERT
    cache_catalogos: dict = {}

    pendientes = []
    errores = []
    insertados = 0

    for i, fila in enumerate(filas, start=1):
        nombre_institucion = fila["nombre"]
        direccion_raw = fila["direccion"]
        telefono = extraer_telefono(fila.get("telefonos"))
        id_tipo = id_tipo_para(fila.get("clasificacion"))

        try:
            feature = geo1_buscar_domicilio(direccion_raw)
        except requests.RequestException as exc:
            errores.append({**fila, "motivo": f"fallo API_GEO1: {exc}"})
            print(f"[{i}/{len(filas)}] ERROR GEO1: {nombre_institucion} -> {exc}")
            continue

        if feature is None:
            pendientes.append({**fila, "motivo": "GEO1 sin resultados"})
            print(f"[{i}/{len(filas)}] PENDIENTE (sin match GEO1): {nombre_institucion}")
            continue

        props = feature.get("properties", {})
        geometry = feature.get("geometry", {})
        coords = geometry.get("coordinates", [None, None])
        coordenada_x, coordenada_y = (coords + [None, None])[:2]

        codigo_calle = props.get("codigoCalle")
        altura = props.get("altura")
        bis = props.get("bis")
        letra = props.get("letra") or ""
        nombre_domicilio = props.get("name") or direccion_raw

        try:
            divs = geo2_obtener_divisiones(codigo_calle, altura, bis, letra)
        except requests.RequestException as exc:
            errores.append({**fila, "motivo": f"fallo API_GEO2: {exc}"})
            print(f"[{i}/{len(filas)}] ERROR GEO2: {nombre_institucion} -> {exc}")
            continue

        fraccion_censal = valor_div(divs, "Fracción Censal")
        radio_censal = valor_div(divs, "Radio Censal")

        try:
            # Resolver FKs de catálogo (distrito, vecinal, barrio, seccional_policial,
            # identidad_barrial) ANTES del insert principal, en la misma transacción.
            fks = resolver_fks_desde_divs(cursor, cache_catalogos, divs)

            id_domicilio_validado = insertar_domicilio_validado(
                cursor,
                codigo_calle=codigo_calle, altura=altura, bis=bis, letra=letra,
                fks=fks,
                coordenada_x=coordenada_x, coordenada_y=coordenada_y,
                fraccion_censal=fraccion_censal, radio_censal=radio_censal,
            )
            id_domicilio = insertar_domicilio(
                cursor,
                nombre=nombre_domicilio,
                id_domicilio_validado=id_domicilio_validado,
            )
            insertar_institucion(
                cursor,
                nombre=nombre_institucion,
                id_domicilio=id_domicilio,
                id_tipo=id_tipo,
                telefono=telefono,
            )
            cnx.commit()
            insertados += 1
            print(f"[{i}/{len(filas)}] OK: {nombre_institucion}")
        except (MySQLError, ValueError) as exc:
            cnx.rollback()
            # como el rollback deshace también los inserts de catálogo hechos en esta
            # transacción, limpiamos del cache las entradas nuevas para que la próxima
            # fila las vuelva a intentar en vez de usar un id inexistente
            cache_catalogos.clear()
            errores.append({**fila, "motivo": f"fallo DB insert: {exc}"})
            print(f"[{i}/{len(filas)}] ERROR DB: {nombre_institucion} -> {exc}")

    cursor.close()
    cnx.close()

    if pendientes:
        with open(PENDIENTES_PATH, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(pendientes[0].keys()))
            w.writeheader()
            w.writerows(pendientes)

    if errores:
        with open(ERRORES_PATH, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(errores[0].keys()))
            w.writeheader()
            w.writerows(errores)

    print("\n--- Resumen ---")
    print(f"Total filas:   {len(filas)}")
    print(f"Insertadas:    {insertados}")
    print(f"Pendientes:    {len(pendientes)}  -> {PENDIENTES_PATH if pendientes else '-'}")
    print(f"Errores:       {len(errores)}  -> {ERRORES_PATH if errores else '-'}")


if __name__ == "__main__":
    sys.exit(main())
import pandas as pd
import pymysql

ARCHIVO_EXCEL = "departamentos.xlsx"

# Leer Excel
df = pd.read_excel(ARCHIVO_EXCEL)

# Obtener provincias únicas
provincias = (
    df["Provincia"]
    .dropna()
    .astype(str)
    .str.strip()
    .drop_duplicates()
    .tolist()
)

print("Provincias encontradas:")
for provincia in provincias:
    print(provincia)

# Conexión a MariaDB
conexion = pymysql.connect(
    host="localhost",
    user="root",
    password="Ch4c4l3s",
    database="infancias",
    charset="utf8mb4"
)

try:
    with conexion.cursor() as cursor:

        for provincia in provincias:

            # Evitar duplicados
            cursor.execute(
                """
                SELECT id
                FROM provincia
                WHERE nombre = %s
                """,
                (provincia,)
            )

            existente = cursor.fetchone()

            if existente:
                print(f"Ya existe: {provincia}")
                continue

            cursor.execute(
                """
                INSERT INTO provincia (nombre)
                VALUES (%s)
                """,
                (provincia,)
            )

            print(f"Insertada: {provincia}")

    conexion.commit()

finally:
    print("Proceso terminado.")


# Leer Excel
df = pd.read_excel(ARCHIVO_EXCEL)


try:
    with conexion.cursor() as cursor:

        for _, fila in df.iterrows():

            departamento = str(fila["Nombre"]).strip()
            provincia = str(fila["Provincia"]).strip()

            if not departamento or not provincia:
                continue

            # Buscar la provincia
            cursor.execute(
                """
                SELECT id
                FROM provincia
                WHERE nombre = %s
                """,
                (provincia,)
            )

            resultado = cursor.fetchone()

            if not resultado:
                print(
                    f"ERROR: no existe la provincia '{provincia}' "
                    f"para el departamento '{departamento}'"
                )
                continue

            id_provincia = resultado[0]

            # Verificar si el departamento ya existe
            cursor.execute(
                """
                SELECT id
                FROM departamento
                WHERE nombre = %s
                  AND id_provincia = %s
                """,
                (departamento, id_provincia)
            )

            existente = cursor.fetchone()

            if existente:
                print(
                    f"Ya existe: {departamento} - {provincia}"
                )
                continue

            # Insertar departamento
            cursor.execute(
                """
                INSERT INTO departamento (nombre, id_provincia)
                VALUES (%s, %s)
                """,
                (departamento, id_provincia)
            )

            print(
                f"Insertado: {departamento} -> {provincia}"
            )

    conexion.commit()

finally:
    conexion.close()


print("Proceso terminado.")
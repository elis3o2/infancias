import csv
import re
import sys
from pathlib import Path

import pdfplumber


COLUMNAS = [
    "distrito",
    "nombre",
    "direccion",
    "telefonos",
    "titular",
    "clasificacion",
]


def limpiar_celda(valor):
    """
    Convierte los saltos de línea internos de una celda
    en espacios.

    NO modifica el contenido.
    """

    if valor is None:
        return ""

    return re.sub(
        r"\s+",
        " ",
        valor
    ).strip()


def obtener_distrito(texto):
    """
    Busca:

        Distrito: CENTRO Cantidad: 63

    y devuelve:

        CENTRO
    """

    patron = (
        r"Distrito:\s*(.*?)"
        r"\s+Cantidad:\s*\d+"
    )

    resultado = re.search(
        patron,
        texto,
        re.IGNORECASE
    )

    if resultado:
        return limpiar_celda(
            resultado.group(1)
        )

    return None


def extraer_tablas(page):
    """
    Extrae las tablas usando las líneas físicas
    dibujadas en el PDF.

    Esto permite respetar las columnas aunque haya
    saltos de línea dentro de una celda.
    """

    settings = {
        "vertical_strategy": "lines",
        "horizontal_strategy": "lines",

        "snap_tolerance": 3,
        "join_tolerance": 3,
        "intersection_tolerance": 5,
        "edge_min_length": 3,
    }

    return page.extract_tables(
        settings
    )


def es_encabezado(row):
    """
    Determina si una fila es el encabezado
    de la tabla.
    """

    if not row:
        return False

    texto = " ".join(
        limpiar_celda(x)
        for x in row
        if x
    ).lower()

    return (
        "nombre" in texto
        and "dirección" in texto
        and "titular" in texto
    )


def procesar_fila(row, distrito):
    """
    Convierte una fila de 5 columnas en un registro.
    """

    if not row:
        return None

    # Asegurar cinco columnas.
    row = list(row)

    while len(row) < 5:
        row.append("")

    # Si por alguna razón hay más columnas,
    # conservamos solamente las cinco de la tabla.
    row = row[:5]

    if es_encabezado(row):
        return None

    nombre = limpiar_celda(row[0])
    direccion = limpiar_celda(row[1])
    telefonos = limpiar_celda(row[2])
    titular = limpiar_celda(row[3])
    clasificacion = limpiar_celda(row[4])

    # Una fila sin contenido no es un registro.
    if not any([
        nombre,
        direccion,
        telefonos,
        titular,
        clasificacion,
    ]):
        return None

    return {
        "distrito": distrito or "",
        "nombre": nombre,
        "direccion": direccion,
        "telefonos": telefonos,
        "titular": titular,
        "clasificacion": clasificacion,
    }


def parsear(pdf_path):

    registros = []

    with pdfplumber.open(pdf_path) as pdf:

        distrito_actual = ""

        for numero_pagina, page in enumerate(
            pdf.pages,
            start=1
        ):

            print(
                f"Procesando página {numero_pagina}..."
            )

            # ------------------------------------------------
            # Obtener distrito de la página
            # ------------------------------------------------

            texto = page.extract_text() or ""

            distrito = obtener_distrito(
                texto
            )

            if distrito:
                distrito_actual = distrito

            # ------------------------------------------------
            # Extraer tablas
            # ------------------------------------------------

            tablas = extraer_tablas(page)

            if not tablas:
                print(
                    f"  ADVERTENCIA: "
                    f"no se encontró tabla"
                )
                continue

            # Puede haber más de una tabla en una página.
            for tabla in tablas:

                for fila in tabla:

                    registro = procesar_fila(
                        fila,
                        distrito_actual
                    )

                    if registro:
                        registros.append(
                            registro
                        )

    return registros


def guardar_csv(
    registros,
    output_path
):

    with open(
        output_path,
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as archivo:

        writer = csv.DictWriter(
            archivo,
            fieldnames=COLUMNAS,
            quoting=csv.QUOTE_MINIMAL
        )

        writer.writeheader()

        writer.writerows(
            registros
        )


def main():

    # --------------------------------------------------------
    # Entrada
    # --------------------------------------------------------

    if len(sys.argv) > 1:

        pdf_path = Path(
            sys.argv[1]
        )

    else:

        pdf_path = Path(
            "listado-1.pdf"
        )

    if not pdf_path.exists():

        print(
            f"ERROR: no existe el archivo:"
            f" {pdf_path}"
        )

        sys.exit(1)

    # --------------------------------------------------------
    # Salida
    # --------------------------------------------------------

    output_path = (
        pdf_path.parent /
        "listado.csv"
    )

    print()
    print("=" * 70)
    print("PARSEANDO LISTADO")
    print("=" * 70)
    print()

    print(
        f"PDF de entrada: {pdf_path}"
    )

    print(
        f"CSV de salida : {output_path}"
    )

    print()

    # --------------------------------------------------------
    # Parsear
    # --------------------------------------------------------

    registros = parsear(
        pdf_path
    )

    # --------------------------------------------------------
    # Guardar
    # --------------------------------------------------------

    guardar_csv(
        registros,
        output_path
    )

    print()
    print("=" * 70)
    print(
        f"REGISTROS ENCONTRADOS: "
        f"{len(registros)}"
    )
    print("=" * 70)

    print()
    print(
        f"CSV generado: "
        f"{output_path}"
    )

    # --------------------------------------------------------
    # Mostrar algunos registros
    # --------------------------------------------------------

    print()
    print("Primeros registros:")
    print("-" * 70)

    for registro in registros[:10]:

        print(
            registro
        )


if __name__ == "__main__":
    main()
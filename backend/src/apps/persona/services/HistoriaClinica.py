"""Agrupación por HC/HCF y enriquecimiento de salud sin repetir consultas."""
from src.apps.api_externa.services import consultar_hcf
from src.apps.api_externa.types import HCFResponse, HCFResultado
from .Consulta import consultar_adolescente, consultar_familiar


def consultar_personas(adolescentes, familiares):
    """Consulta antecedentes sin filtrar solicitudes por equipo y agrupa por HCF."""

    adolescentes_resp = [
        consultar_adolescente(adolescente)
        for adolescente in adolescentes
    ]

    familiares_resp = [
        consultar_familiar(familiar)
        for familiar in familiares
    ]

    personas_resp = adolescentes_resp + familiares_resp

    def normalizar_hc(hc):
        if hc is None:
            return None

        hc = str(hc).strip()

        return hc if hc else None

    def clave_persona(dni: str | None, sexo: str | None) -> tuple[str, str | None] | None:
        """Identifica una persona por DNI + sexo, recibidos de su contrato exacto."""
        if dni is None:
            return None

        return (
            str(dni).strip(),
            str(sexo).strip().upper() if sexo else None,
        )

    # ---------------------------------------------------------
    # Personas originales recibidas como input
    # ---------------------------------------------------------

    personas_input = {
        clave
        for persona in adolescentes + familiares
        if (clave := clave_persona(persona["dni"], persona["sexo"])) is not None
    }

    # ---------------------------------------------------------
    # HC individuales encontrados en persona / ciudadano
    #
    # Se mantiene el orden porque primero queremos consultar
    # el primer HC y aprovechar todos los integrantes de su HCF.
    # ---------------------------------------------------------

    hc_ids = []
    hc_vistos = set()

    for persona_resp in personas_resp:
        for origen in ("persona", "ciudadano"):
            datos = persona_resp.get(origen) or {}

            hc = normalizar_hc(datos.get("hc"))

            if hc is not None and hc not in hc_vistos:
                hc_vistos.add(hc)
                hc_ids.append(hc)

    # ---------------------------------------------------------
    # HC individual -> datos devueltos por consultar_hcf
    #
    # Ejemplo:
    #
    # {
    #     "391236": HCFResultado(...),
    #     "123456": HCFResultado(...),
    # }
    # ---------------------------------------------------------

    resultados_por_hc: dict[str, HCFResultado] = {}

    # HC individual -> HCF a la que pertenece
    #
    # Ejemplo:
    #
    # {
    #     "391236": "1546",
    #     "123456": "1546",
    # }
    #
    hcf_por_hc: dict[str, str] = {}

    # Personas encontradas dentro de las HCF pero que
    # no fueron enviadas originalmente como input.
    personas_hcf_adicionales: dict[str, HCFResultado] = {}

    # ---------------------------------------------------------
    # Procesar una respuesta de consultar_hcf
    # ---------------------------------------------------------

    def procesar_respuesta_hcf(respuesta: HCFResponse | None) -> None:
        if respuesta is None:
            return

        hcf = normalizar_hc(respuesta["hcf"])

        for resultado in respuesta["resultados"]:
            hc = normalizar_hc(resultado["numeroHCI"])

            if hc is None:
                continue

            # Guardamos los datos de esa persona por su HC individual.
            resultados_por_hc[hc] = resultado

            # Guardamos a qué HCF pertenece ese HC.
            if hcf is not None:
                hcf_por_hc[hc] = hcf

            # Si esta persona no estaba entre los inputs,
            # queda como integrante adicional de la HCF.
            clave = clave_persona(resultado["DNI"], resultado["sexo"])

            if hc not in hc_vistos and clave not in personas_input:
                personas_hcf_adicionales[hc] = resultado

    # ---------------------------------------------------------
    # Consultar HCF
    #
    # Ejemplo:
    #
    # Inputs:
    #   HC 100
    #   HC 200
    #   HC 300
    #
    # consultar_hcf(100) devuelve:
    #   HCF 50
    #   integrantes HC 100, 200 y 400
    #
    # Entonces:
    #   HC 200 ya fue encontrado -> NO se consulta
    #   HC 300 no apareció       -> consultar_hcf(300)
    # ---------------------------------------------------------

    hc_consultados = set()

    for hc in hc_ids:

        # Si apareció dentro de una HCF consultada anteriormente,
        # ya tenemos sus datos.
        if hc in resultados_por_hc:
            continue

        if hc in hc_consultados:
            continue

        hc_consultados.add(hc)

        respuesta = consultar_hcf(hc)

        procesar_respuesta_hcf(respuesta)

    # ---------------------------------------------------------
    # Enriquecer adolescentes y familiares
    # ---------------------------------------------------------

    for persona_resp in personas_resp:

        for origen in ("persona", "ciudadano"):

            datos = persona_resp.get(origen)

            if not datos:
                continue

            # Acá buscamos HC INDIVIDUAL, no HCF.
            hc = normalizar_hc(datos.get("hc"))

            if hc is None:
                continue

            resultado_hc = resultados_por_hc.get(hc)

            if resultado_hc is None:
                continue

            datos.update({
                # HCF a la que pertenece la persona
                "hcf": hcf_por_hc.get(hc),

                "discapacidades":
                    resultado_hc["flag_discapacidades"],

                "consumos_problematicos":
                    resultado_hc["flag_consumos_problematicos"],

                "intentos_de_suicidio":
                    resultado_hc["flag_intentos_de_suicidio"],

                "problemas_socioambientales":
                    resultado_hc["flag_problemas_socioambientales"],

                "violencias": resultado_hc["flag_violencias"],
            })

    return {
        "adolescentes": adolescentes_resp,
        "familiares": familiares_resp,
        "hcf": [
            {**persona, "hcf": hcf_por_hc.get(hc)}
            for hc, persona in personas_hcf_adicionales.items()
        ],
    }

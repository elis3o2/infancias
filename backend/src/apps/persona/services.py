import logging
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import (
    Persona,
    PersonaDomicilio,
    PersonaTelefono,
    Adolescente,
    AdolescenteInstitucion,
    Legajo,
    Carpeta,
    Relacion,
    Familiar,
    Vinculo,
)
from src.apps.domicilio.services import crear_domicilio, crear_institucion
from src.apps.domicilio.models import Institucion
from src.apps.solicitud.models import Solicitud
from src.apps.api_externa.services import consultar_hcf, consultar_digitalizacion
from src.apps.api_externa.types import HCFResponse, HCFResultado

logger = logging.getLogger(__name__)

# Las columnas ``letra`` siguen siendo obligatorias en la base histórica, pero
# ya no son un dato que ingrese o vea el operador. "A" identifica números que
# llegaron desde el sistema externo y "B" los registros creados localmente.
MARCADOR_RECIBIDO = "A"
MARCADOR_LOCAL = "B"
DATOS_SALUD = (
    "hc", "hcf", "discapacidades", "consumos_problematicos", "intentos_de_suicidio",
    "problemas_socioambientales", "violencias",
)



def buscar_persona(dni: str, sexo: str | None = None) -> Persona | None:
    consulta = Persona.objects.filter(dni=dni)
    if sexo:
        consulta = consulta.filter(sexo=sexo)
    return consulta.order_by("id").first()


def actualizar_domicilio(persona: Persona, domicilio) -> None:

    if domicilio is None:
        return

    ultimo_domicilio = (
        PersonaDomicilio.objects
        .filter(persona=persona)
        .order_by("-fecha_carga")
        .first()
    )

    if (
        ultimo_domicilio is None
        or ultimo_domicilio.domicilio_id != domicilio.id
    ):
        PersonaDomicilio.objects.create(
            persona=persona,
            domicilio=domicilio,
            fecha_carga=timezone.now(),
        )


def actualizar_telefono(persona: Persona, telefono: str | None) -> None:

    if not telefono:
        return

    telefono_existente = PersonaTelefono.objects.filter(
        persona=persona,
        telefono=telefono,
    ).exists()

    if not telefono_existente:
        PersonaTelefono.objects.create(
            persona=persona,
            telefono=telefono,
            fecha_carga=timezone.now(),
        )


def procesar_datos_persona(persona: Persona, domicilio_data, telefono: str | None):
    domicilio = None

    if domicilio_data is not None:
        domicilio = crear_domicilio(dict(domicilio_data))

        actualizar_domicilio(
            persona=persona,
            domicilio=domicilio,
        )

    if telefono:
        actualizar_telefono(
            persona=persona,
            telefono=telefono,
        )

    return domicilio


@transaction.atomic
def crear_familiar(datos_familiar: dict, adolescente: Adolescente) -> Familiar:
    datos_familiar = datos_familiar.copy()
    domicilio_data = datos_familiar.pop("domicilio", None)

    for field in ("telefono", "dni", "sexo"):
        if datos_familiar.get(field) == "":
            datos_familiar[field] = None

    vinculo = datos_familiar.get("vinculo")
    if vinculo is not None and vinculo.adolescente:
        raise ValidationError({"id_vinculo": "El vínculo debe ser de tipo familiar."})

    domicilio_obj = (
        crear_domicilio(dict(domicilio_data))
        if domicilio_data is not None
        else None
    )

    familiar = Familiar.objects.create(
        solicitud=adolescente.solicitud,
        adolescente=adolescente,
        domicilio=domicilio_obj,
        **datos_familiar,
    )

    return familiar


def _resolver_referencia_institucion(
    referencia_data: dict,
    referencias_por_temp: dict[str, Institucion] | None,
) -> Institucion:
    """Resuelve una referencia existente o crea una sola por ``id_temp``.

    El caché dura únicamente durante la creación de una solicitud. Así dos
    adolescentes pueden apuntar a la misma institución nueva sin convertir la
    referencia en un dato de ``Solicitud``.
    """
    referencia_data = referencia_data.copy()
    id_temp = referencia_data.pop("id_temp", None)
    referencia = referencia_data.pop("id", None)

    if id_temp and referencias_por_temp is not None and id_temp in referencias_por_temp:
        existente = referencias_por_temp[id_temp]
        if referencia is not None and referencia.pk != existente.pk:
            raise ValidationError({
                "referencias_instituciones_data": (
                    "Un id_temp de referencia no puede identificar instituciones distintas."
                )
            })
        return existente

    if referencia is None:
        referencia = crear_institucion(referencia_data)
    elif not isinstance(referencia, Institucion):
        raise ValidationError({"referencias_instituciones_data": "La institución es inválida."})

    if id_temp and referencias_por_temp is not None:
        referencias_por_temp[id_temp] = referencia

    return referencia


@transaction.atomic
def crear_adolescente(
    datos_adolescente: dict,
    solicitud: Solicitud,
    *,
    referencias_por_temp: dict[str, Institucion] | None = None,
) -> Adolescente:
    datos_adolescente = datos_adolescente.copy()
    domicilio_data = datos_adolescente.pop("domicilio", None)
    datos_adolescente.pop("id_temp", None)
    familiares_data = datos_adolescente.pop("familiares", [])
    referencias_data = datos_adolescente.pop("referencias_instituciones_data", [])

    if domicilio_data is None:
        raise ValidationError({"adolescentes": "El domicilio es obligatorio."})

    domicilio_obj = crear_domicilio(dict(domicilio_data))

    adolescente = Adolescente.objects.create(
        domicilio=domicilio_obj,
        solicitud=solicitud,
        **datos_adolescente,
    )

    for familiar_data in familiares_data:
        crear_familiar(familiar_data, adolescente)

    for referencia_data in referencias_data:
        referencia = _resolver_referencia_institucion(
            referencia_data,
            referencias_por_temp,
        )
        AdolescenteInstitucion.objects.get_or_create(
            adolescente=adolescente, institucion=referencia,
        )

    return adolescente


def _resolver_carpeta(numero: int | None) -> Carpeta:
    if numero is not None:
        carpeta = (
            Carpeta.objects.filter(
                id_insert=numero,
                letra=MARCADOR_RECIBIDO,
            )
            .order_by("id")
            .first()
        )
        if carpeta is not None:
            return carpeta

    return Carpeta.objects.create(
        id_insert=numero,
        letra=MARCADOR_RECIBIDO if numero is not None else MARCADOR_LOCAL,
    )


def _resolver_legajo(numero: int | None, carpeta: Carpeta) -> Legajo:
    if numero is not None:
        legajo = (
            Legajo.objects.filter(
                id_insert=numero,
                letra=MARCADOR_RECIBIDO,
            )
            .order_by("id")
            .first()
        )
        if legajo is not None:
            return legajo

    return Legajo.objects.create(
        carpeta=carpeta,
        id_insert=numero,
        letra=MARCADOR_RECIBIDO if numero is not None else MARCADOR_LOCAL,
    )


def resolver_legajo(legajo_data=None, carpeta_data=None, carpeta_adolescente=None) -> Legajo:
    """Resuelve los números de legajo y carpeta sin usar letras de la interfaz."""
    # Los hermanos mantienen la carpeta del adolescente validado. El número
    # de carpeta que pudieran enviar no reemplaza esa asociación familiar.
    if carpeta_adolescente is not None:
        numero_legajo = legajo_data.get("id_insert") if legajo_data else None
        return _resolver_legajo(numero_legajo, carpeta_adolescente)

    # La pantalla unificada guarda ambos números dentro de ``legajo``.
    if carpeta_data is None and legajo_data:
        carpeta_data = {"id_insert": legajo_data.get("carpeta_id")}

    numero_carpeta = carpeta_data.get("id_insert") if carpeta_data else None
    numero_legajo = legajo_data.get("id_insert") if legajo_data else None

    carpeta = _resolver_carpeta(numero_carpeta)
    return _resolver_legajo(numero_legajo, carpeta)



def _actualizar_salud(persona: Persona, datos: dict) -> None:
    campos = [campo for campo in DATOS_SALUD if campo in datos]
    for campo in campos:
        setattr(persona, campo, datos[campo])
    if campos:
        persona.save(update_fields=campos)


def _crear_persona_validada(datos: dict) -> Persona:
    """Crea con los datos recibidos por PersonaValidateSerializer, sin repetir APIs."""
    datos_salud = {campo: False for campo in DATOS_SALUD if campo not in ("hc", "hcf")}
    datos_salud.update({campo: datos[campo] for campo in DATOS_SALUD if campo in datos})
    return Persona.objects.create(
        nombre=datos["nombre"],
        apellido=datos["apellido"],
        sexo=datos["sexo"],
        dni=datos["dni"],
        fecha_nacimiento=datos["fecha_nacimiento"],
        legajo=None,
        **datos_salud,
    )


@transaction.atomic
def validar_adolescente(adolescente: Adolescente, datos: dict) -> Persona:
    if (datos["dni"], datos["sexo"]) != (adolescente.dni, adolescente.sexo):
        raise ValidationError({"persona": "La identidad no coincide con el adolescente de la solicitud."})
    persona = buscar_persona(dni=adolescente.dni, sexo=adolescente.sexo)
    if persona is None:
        persona = _crear_persona_validada(datos)
    else:
        _actualizar_salud(persona, datos)

    if adolescente.persona_id is not None and adolescente.persona_id != persona.id:
        raise ValidationError({"adolescentes": "El adolescente ya tiene otra persona asociada."})

    if adolescente.persona_id != persona.id:
        adolescente.persona = persona
        adolescente.save(update_fields=["persona"])

    actualizar_domicilio(persona, adolescente.domicilio)
    return persona


@transaction.atomic
def validar_familiar(
    familiar: Familiar,
    datos: dict,
    adolescente: Persona,
) -> Persona:
    if familiar.adolescente_id is None or familiar.adolescente.persona_id != adolescente.id:
        raise ValidationError({"familiares": "El familiar no pertenece al adolescente indicado."})
    if familiar.solicitud_id != familiar.adolescente.solicitud_id:
        raise ValidationError({"familiares": "La solicitud del familiar no coincide con la del adolescente."})

    datos_persona = datos["persona"]
    dni = datos_persona["dni"]
    sexo = datos_persona["sexo"]
    vinculo = datos["vinculo"]

    if vinculo.adolescente:
        raise ValidationError({"vinculo": "El vínculo debe ser de tipo familiar."})

    persona = buscar_persona(dni=dni, sexo=sexo)
    if persona is None:
        persona = _crear_persona_validada(datos_persona)
    else:
        _actualizar_salud(persona, datos_persona)

    if persona.id == adolescente.id:
        raise ValidationError({"familiares": "El adolescente no puede ser su propio familiar."})
    if familiar.persona_id is not None and familiar.persona_id != persona.id:
        raise ValidationError({"familiares": "El familiar ya tiene otra persona asociada."})

    if datos.get("domicilio") is not None:
        familiar.domicilio = crear_domicilio(datos["domicilio"].copy())
    if "telefono" in datos:
        familiar.telefono = datos["telefono"] or None

    actualizar_domicilio(persona, familiar.domicilio)
    actualizar_telefono(persona, familiar.telefono)

    familiar.persona = persona
    familiar.vinculo = vinculo
    familiar.dni = persona.dni
    familiar.sexo = persona.sexo
    familiar.nombre = persona.nombre
    familiar.apellido = persona.apellido
    familiar.save()

    relacion = Relacion.objects.filter(
        Q(persona_1=adolescente, persona_2=persona)
        | Q(persona_1=persona, persona_2=adolescente),
        vinculo=vinculo,
    ).exists()
    if not relacion:
        Relacion.objects.create(persona_1=adolescente, persona_2=persona, vinculo=vinculo)
    return persona


def resolver_legajos_solicitud(personas_datos: list[tuple[Persona, dict | None]]) -> None:
    """Asigna los legajos al final, sin mover legajos entre carpetas existentes."""
    carpetas = {}
    legajos = []
    personas_recibidas = set()
    numeros_recibidos = set()
    for persona, datos in personas_datos:
        if persona.id in personas_recibidas:
            raise ValidationError({"adolescentes": "Una misma persona figura en dos adolescentes."})
        personas_recibidas.add(persona.id)
        datos = datos or {}
        numero = datos.get("id_insert")
        numero_carpeta = datos.get("carpeta_id")
        legajo = persona.legajo

        if numero is not None:
            if numero in numeros_recibidos:
                raise ValidationError({"legajo": "Un mismo legajo no puede asignarse a dos adolescentes."})
            numeros_recibidos.add(numero)

        if datos.get("id") is not None:
            recibido = Legajo.objects.filter(pk=datos["id"]).first()
            if recibido is None:
                raise ValidationError({"legajo": "El legajo indicado no existe."})
            if legajo is not None and legajo.id != recibido.id:
                raise ValidationError({"legajo": "La persona ya tiene otro legajo."})
            legajo = recibido

        if numero is not None:
            if legajo is not None and (
                legajo.id_insert != numero or legajo.letra != MARCADOR_RECIBIDO
            ):
                raise ValidationError({"legajo": "El número informado no coincide con el legajo existente."})
            if legajo is None:
                legajo = Legajo.objects.filter(
                    id_insert=numero, letra=MARCADOR_RECIBIDO,
                ).order_by("id").first()

        if legajo is not None:
            if Persona.objects.filter(legajo=legajo).exclude(pk=persona.id).exists():
                raise ValidationError({"legajo": "El legajo ya pertenece a otra persona."})
            carpetas[legajo.carpeta_id] = legajo.carpeta

        if numero_carpeta is not None:
            carpeta = _resolver_carpeta(numero_carpeta)
            carpetas[carpeta.id] = carpeta

        legajos.append((persona, legajo, numero))

    if len(carpetas) > 1:
        raise ValidationError({
            "legajo": "Los adolescentes tienen carpetas distintas. Debe resolver el conflicto antes de validar."
        })
    if not legajos:
        return

    carpeta = next(iter(carpetas.values())) if carpetas else _resolver_carpeta(None)
    usados = set()
    for persona, legajo, numero in legajos:
        if legajo is None:
            legajo = _resolver_legajo(numero, carpeta)
        if legajo.carpeta_id != carpeta.id or legajo.id in usados:
            raise ValidationError({"legajo": "No se pudo asignar un legajo individual en la carpeta compartida."})
        usados.add(legajo.id)
        if persona.legajo_id != legajo.id:
            persona.legajo = legajo
            persona.save(update_fields=["legajo"])



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



def _serializar_persona_consulta(persona: Persona | None) -> dict | None:
    if persona is None:
        return None

    return {
        "nombre": persona.nombre,
        "apellido": persona.apellido,
        "sexo": persona.sexo,
        "fecha_nacimiento": persona.fecha_nacimiento,
        "dni": persona.dni,
        "legajo": persona.legajo.numero if persona.legajo_id else None,
        "carpeta": (
            persona.legajo.carpeta.numero
            if persona.legajo_id and persona.legajo.carpeta_id
            else None
        ),
        "hc": persona.hc,
        "hcf": persona.hcf,
        "discapacidades": persona.discapacidades,
        "consumos_problematicos": persona.consumos_problematicos,
        "intentos_de_suicidio": persona.intentos_de_suicidio,
        "problemas_socioambientales": persona.problemas_socioambientales,
        "violencias": persona.violencias,
    }


def consultar_adolescente(data):

    dni = data["dni"]
    sexo = data["sexo"]

    persona = buscar_persona(dni=dni, sexo=sexo)

    ciudadano = None

    if not persona:
        ciudadano = consultar_digitalizacion(dni=dni, sexo=sexo)

    relaciones = []

    if persona:
        relaciones = consultar_relaciones(persona)

    return {
        "id": data["id"],

        "solicitudes": consultar_solicitudes(
            persona=persona,
            dni=dni,
            sexo=sexo
        ),

        "persona": _serializar_persona_consulta(persona),
        "ciudadano": ciudadano if ciudadano is not None else None,
        "relaciones": relaciones,
    }


def consultar_relaciones(persona):

    relaciones = Relacion.objects.filter(
        Q(persona_1=persona) | Q(persona_2=persona)
    ).select_related(
        "vinculo",
        "persona_1",
        "persona_2",
    )

    resultado = []

    for relacion in relaciones:

        persona_relacionada = (
            relacion.persona_2
            if relacion.persona_1_id == persona.id
            else relacion.persona_1
        )

        resultado.append({
            "vinculo": relacion.vinculo.nombre,
            "persona": {
                "nombre": persona_relacionada.nombre,
                "apellido": persona_relacionada.apellido,
                "dni": persona_relacionada.dni,
                "sexo": persona_relacionada.sexo,
            }
        })

    return resultado


def consultar_solicitudes(
    persona: Persona | None,
    dni=None,
    sexo=None
):

    if persona is None:
        return []

    solicitudes = Solicitud.objects.filter(
        adolescentes__persona=persona,
        rechazado=False
    )

    solicitudes = solicitudes.select_related(
        "equipo",
        "motivo",
    ).distinct()

    return [
        {
            "id": solicitud.id,
            "fecha_creacion": solicitud.fecha_hora_creacion,
            "equipo": solicitud.equipo.nombre if solicitud.equipo_id else None,
            "motivo": solicitud.motivo.nombre if solicitud.motivo_id else None,
        }
        for solicitud in solicitudes
    ]


def consultar_familiar(data):

    dni = data["dni"]
    sexo = data["sexo"]

    persona = buscar_persona(dni=dni, sexo=sexo)
    ciudadano = None

    if not persona:
        ciudadano = consultar_digitalizacion(dni=dni, sexo=sexo)

    return {
        "id": data["id"],
        "persona": _serializar_persona_consulta(persona),
        "ciudadano": ciudadano if ciudadano is not None else None,
        "relaciones": consultar_relaciones(persona) if persona else [],
    }

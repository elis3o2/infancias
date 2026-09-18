import logging
from collections.abc import Iterable

import requests
from decouple import config
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import (Persona, PersonaDomicilio, PersonaTelefono, Adolescente, Legajo,
    Carpeta, Relacion, Familiar, Vinculo)
from src.apps.domicilio.services import crear_domicilio
from src.apps.solicitud.models import Solicitud


logger = logging.getLogger(__name__)

# Las columnas ``letra`` siguen siendo obligatorias en la base histórica, pero
# ya no son un dato que ingrese o vea el operador. "A" identifica números que
# llegaron desde el sistema externo y "B" los registros creados localmente.
MARCADOR_RECIBIDO = "A"
MARCADOR_LOCAL = "B"



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
def crear_familiar(datos_familiar: dict, solicitud: Solicitud) -> Familiar:
    datos_familiar = datos_familiar.copy()
    domicilio_data = datos_familiar.pop("domicilio", None)

    for field in ("telefono", "dni", "sexo"):
        if datos_familiar.get(field) == "":
            datos_familiar[field] = None

    domicilio_obj = (
        crear_domicilio(dict(domicilio_data))
        if domicilio_data is not None
        else None
    )

    familiar = Familiar.objects.create(
        solicitud=solicitud,
        domicilio=domicilio_obj,
        **datos_familiar,
    )

    return familiar


@transaction.atomic
def crear_adolescente(datos_adolescente: dict, solicitud: Solicitud) -> Adolescente:
    datos_adolescente = datos_adolescente.copy()
    domicilio_data = datos_adolescente.pop("domicilio", None)

    if domicilio_data is None:
        raise ValidationError({"adolescentes": "El domicilio es obligatorio."})

    domicilio_obj = crear_domicilio(dict(domicilio_data))

    adolescente = Adolescente.objects.create(
        domicilio=domicilio_obj,
        solicitud=solicitud,
        **datos_adolescente,
    )

    return adolescente


def _resolver_carpeta(numero: int | None) -> Carpeta:
    """Resuelve una carpeta externa (A) o una creada localmente (B)."""
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
    """Resuelve un legajo externo (A) o uno creado localmente (B)."""
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


def _asegurar_legajo_familiar_nulo(persona: Persona) -> None:
    """Quita el legajo de un familiar sin alterar a un adolescente asociado."""
    if persona.adolescentes.exists():
        raise ValidationError({
            "familiares_validados": (
                "La persona indicada ya está asociada como adolescente y no "
                "puede validarse también como familiar."
            )
        })

    persona.legajo = None


def validar_adolescente(adolescente: Adolescente, data) -> Persona:

    data = data.copy()

    legajo_data = data.pop("legajo", None)
    domicilio_data = data.pop("domicilio", None)
    telefono = data.pop("telefono", None)

    dni = data.get("dni")
    sexo = data.get("sexo")

    if not dni:
        raise ValidationError({
            "adolescente_validado": (
                "El DNI es obligatorio."
            )
        })

    if not sexo:
        raise ValidationError({
            "adolescente_validado": (
                "El sexo es obligatorio."
            )
        })

    persona = buscar_persona(dni=dni, sexo=sexo)

    if persona is not None:
        # Encontrar una persona existente no debe reemplazar su legajo por uno
        # vacío creado desde el formulario de validación.
        for campo in ("dni", "sexo", "nombre", "apellido", "fecha_nacimiento"):
            setattr(persona, campo, data[campo])

        if legajo_data and any(legajo_data.values()):
            persona.legajo = resolver_legajo(legajo_data=legajo_data)
        elif persona.legajo_id is None:
            # Sin números externos se crean legajo y carpeta locales (B).
            persona.legajo = resolver_legajo()
        persona.save()
    else:
        try:
            persona = Persona.objects.create(
                legajo=resolver_legajo(legajo_data=legajo_data),
                **data,
            )
        except Exception as exc:
            raise ValidationError({
                "adolescente_validado": (
                    "No se pudo crear la persona: "
                    f"{exc}"
                )
            }) from exc

    # Asociar Persona al Adolescente
    if adolescente.persona_id != persona.id:

        adolescente.persona = persona

        adolescente.save(
            update_fields=["persona"]
        )

    # Domicilio y teléfono
    procesar_datos_persona(
        persona=persona,
        domicilio_data=domicilio_data,
        telefono=telefono,
    )

    return persona




def validar_familiar(
    adolescente: Adolescente | None,
    persona_adolescente: Persona | None,
    data: dict,
    *,
    solicitud: Solicitud | None = None,
    personas_adolescentes: Iterable[Persona] | None = None,
    vinculo_por_defecto: str | None = None,
) -> Persona:

    data = data.copy()

    if solicitud is None and adolescente is not None:
        solicitud = adolescente.solicitud
    if solicitud is None:
        raise ValidationError({"familiares_validados": "No se encontró la solicitud."})

    personas_adolescentes = list(personas_adolescentes or [])
    if persona_adolescente is not None and persona_adolescente not in personas_adolescentes:
        personas_adolescentes.append(persona_adolescente)
    if not personas_adolescentes:
        raise ValidationError({
            "familiares_validados": "Primero se debe validar al adolescente."
        })

    familiar_id = data.pop("id_familiar", None)
    domicilio_data = data.pop("domicilio", None)

    telefono = data.pop("telefono", None)

    vinculo_id = data.pop("id_vinculo", None)

    # Los familiares no tienen legajo propio.
    data.pop("legajo", None)

    dni = data.get("dni")
    sexo = data.get("sexo")

    # -----------------------------------------------------
    # Validar vínculo
    # -----------------------------------------------------

    if vinculo_id is None and vinculo_por_defecto:
        vinculo_id = (
            Vinculo.objects.filter(nombre__iexact=vinculo_por_defecto)
            .values_list("id", flat=True)
            .first()
        )

    if vinculo_id is None:
        raise ValidationError({
            "familiares_validados": (
                "El id_vinculo es obligatorio."
            )
        })

    vinculo = Vinculo.objects.filter(
        pk=vinculo_id,
    ).first()

    if vinculo is None:
        raise ValidationError({
            "familiares_validados": (
                f"El vínculo {vinculo_id} no existe."
            )
        })

    if not dni:
        raise ValidationError({
            "familiares_validados": (
                "El DNI es obligatorio."
            )
        })

    if not sexo:
        raise ValidationError({
            "familiares_validados": (
                "El sexo es obligatorio."
            )
        })

    persona = buscar_persona(dni=dni,sexo=sexo)

    if persona is not None:

        # La Persona es global. Si ya está asociada a un adolescente, quitar
        # su legajo para usarla como familiar dañaría ese registro.
        _asegurar_legajo_familiar_nulo(persona)

        for campo, valor in data.items():
            setattr(
                persona,
                campo,
                valor,
            )

        persona.save()

    else:
        try:
            persona = Persona.objects.create(
                legajo=None,
                **data,
            )
        except Exception as exc:
            raise ValidationError({
                "familiares_validados": (
                    "No se pudo crear la Persona "
                    f"del familiar: {exc}"
                )
            }) from exc


    if familiar_id is not None:
        familiar = Familiar.objects.filter(
            pk=familiar_id,
            solicitud=solicitud,
        ).first()

        if familiar is None:
            raise ValidationError({
                "familiares_validados": (
                    f"El familiar {familiar_id} "
                    "no pertenece a la solicitud."
                )
            })

        if (
            familiar.persona_id is not None
            and familiar.persona_id != persona.id
        ):
            raise ValidationError({
                "familiares_validados": (
                    f"El familiar {familiar_id} "
                    "ya tiene una Persona asociada."
                )
            })

    # Domicilio y teléfono se registran en el historial de la persona. Para
    # familiares nuevos reutilizamos ese domicilio también en la solicitud.
    domicilio = procesar_datos_persona(
        persona=persona,
        domicilio_data=domicilio_data,
        telefono=telefono,
    )

    if familiar_id is not None:
        familiar.persona = persona
        familiar.vinculo = vinculo
        if domicilio is not None:
            familiar.domicilio = domicilio
        if telefono is not None:
            familiar.telefono = telefono or None
        for campo in ("dni", "sexo", "nombre", "apellido"):
            setattr(familiar, campo, data[campo])
        familiar.save()
    else:
        Familiar.objects.create(
            solicitud=solicitud,
            persona=persona,
            vinculo=vinculo,
            domicilio=domicilio,
            telefono=telefono or None,
            dni=data["dni"],
            sexo=data["sexo"],
            nombre=data["nombre"],
            apellido=data["apellido"],
        )

    for adolescente_persona in personas_adolescentes:
        if adolescente_persona.id == persona.id:
            continue

        relacion_existe = Relacion.objects.filter(
            Q(persona_1=adolescente_persona, persona_2=persona)
            | Q(persona_1=persona, persona_2=adolescente_persona),
            vinculo=vinculo,
        ).exists()
        if not relacion_existe:
            Relacion.objects.create(
                persona_1=adolescente_persona,
                persona_2=persona,
                vinculo=vinculo,
            )

    return persona


def consultar_personas(adolescentes, familiares, *, equipo_id: int | None = None):
    """Obtiene antecedentes visibles para el equipo que realiza la consulta."""

    adolescentes_resp = [
        consultar_adolescente(adolescente, equipo_id=equipo_id)
        for adolescente in adolescentes
    ]

    familiares_resp = [
        consultar_familiar(familiar)
        for familiar in familiares
    ]

    hcf_ids = {
        hcf
        for x in familiares_resp + adolescentes_resp
        for hcf in (
            (x.get("ciudadano") or {}).get("hcf"),
            (x.get("persona") or {}).get("hcf"),
        )
        if hcf is not None
    }

    hcf_resp = [
        respuesta
        for hcf in hcf_ids
        if (respuesta := consultar_hcf(hcf)) is not None
    ]

    return {
        "adolescentes": adolescentes_resp,
        "familiares": familiares_resp,
        "hcf": hcf_resp,
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
        "legajo": persona.legajo.id_insert if persona.legajo_id else None,
        "carpeta": (
            persona.legajo.carpeta.id_insert
            if persona.legajo_id and persona.legajo.carpeta_id
            else None
        ),
        "hcf": persona.hcf,
    }


def consultar_adolescente(data, *, equipo_id: int | None = None):

    dni = data["dni"]
    sexo = data["sexo"]

    persona = buscar_persona(dni=dni, sexo=sexo)

    ciudadano = None

    if not persona:
        ciudadano = consultar_ciudadano(dni=dni, sexo=sexo)

    relaciones = []

    if persona:
        relaciones = consultar_relaciones(persona)

    return {
        "id": data["id"],

        "solicitudes": consultar_solicitudes(
            persona=persona,
            dni=dni,
            sexo=sexo,
            equipo_id=equipo_id,
        ),

        "persona": _serializar_persona_consulta(persona),
        "ciudadano": ciudadano,
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
    sexo=None,
    *,
    equipo_id: int | None = None,
):

    if persona is None:
        return []

    solicitudes = Solicitud.objects.filter(
        adolescentes__persona=persona,
        rechazado=False
    )
    if equipo_id is not None:
        solicitudes = solicitudes.filter(equipo_id=equipo_id)

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


def consultar_ciudadano(dni, sexo):
    """Consulta la fuente externa sin convertir una ausencia en un rechazo."""
    if not sexo:
        return None

    # Esta consulta de identidad usa la misma fuente HC configurada por la
    # aplicación. API_HCF es otro servicio, exclusivamente para integrantes
    # de una historia clínica familiar.
    url = config("API_HC", default="")
    api_key = config("KEY_HC", default="")
    if not url:
        logger.warning("La consulta de ciudadano no está configurada.")
        return None

    try:
        # El entorno de desarrollo expone proxies locales que no existen en
        # el servidor de la aplicación. La conexión directa es la ruta usada
        # por el servicio de Ciudadano.
        session = requests.Session()
        session.trust_env = False
        response = session.get(
            url,
            params={
                "api_key": api_key,
                "documento": dni,
                "sexo": sexo,
            },
            timeout=10,
        )
    except requests.Timeout:
        logger.warning("La consulta de ciudadano excedió el tiempo de espera.")
        return None
    except requests.RequestException as exc:
        # No registrar ``str(exc)``: puede incluir la URL con la clave API.
        logger.warning(
            "No fue posible conectar con el servicio de ciudadano (%s).",
            type(exc).__name__,
        )
        return None

    # La fuente utiliza 404 cuando el documento no tiene resultados. Es una
    # ausencia normal, no una caída del servicio ni un rechazo automático.
    if response.status_code == 404:
        logger.info("No se encontraron datos de ciudadano para la consulta.")
        return None

    try:
        response.raise_for_status()
    except requests.HTTPError:
        logger.warning(
            "El servicio de ciudadano respondió con HTTP %s.",
            response.status_code,
        )
        return None

    try:
        data = response.json()
    except ValueError:
        logger.warning("El servicio de ciudadano devolvió una respuesta inválida.")
        return None

    if not isinstance(data, dict):
        logger.warning("El servicio de ciudadano devolvió una respuesta inesperada.")
        return None

    sisa_data = data.get("sisa_data")
    if not isinstance(sisa_data, dict):
        sisa_data = {}

    # API_HC puede entregar los datos identificatorios en ``ciudadano`` o
    # directamente dentro de ``sisa_data``. Sólo aceptamos una estructura que
    # realmente tenga algún dato de identidad, para no confundir coberturas o
    # adscripciones sin persona con un resultado válido.
    def contiene_identidad(valor):
        return isinstance(valor, dict) and any(
            valor.get(campo) not in (None, "")
            for campo in (
                "nombre", "nombres", "apellido", "apellidos", "nroDocumento",
                "dni", "documento", "fechaNacimiento", "fecha_nacimiento",
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
    results_query1 = data.get("results_query1", [])
    if not isinstance(results_query1, list):
        results_query1 = []

    if ciudadano is None:
        logger.info("El servicio de ciudadano no informó datos para la consulta.")
        return None

    fecha_nacimiento = ciudadano.get("fechaNacimiento") or ciudadano.get("fecha_nacimiento")
    nro_documento = (
        ciudadano.get("nroDocumento") or ciudadano.get("dni") or ciudadano.get("documento") or dni
    )
    hcf = (
        ciudadano.get("hcf")
        or ciudadano.get("hc")
        or next(
            (
                item.get("hc")
                for item in results_query1
                if isinstance(item, dict) and item.get("hc")
            ),
            None,
        )
    )

    return {
        "nombre": ciudadano.get("nombre") or ciudadano.get("nombres"),
        "apellido": ciudadano.get("apellido") or ciudadano.get("apellidos"),
        "sexo": ciudadano.get("sexo"),
        "fechaNacimiento": fecha_nacimiento,
        "nroDocumento": nro_documento,
        # Alias utilizados por la vista de antecedentes interna.
        "fecha_nacimiento": fecha_nacimiento,
        "dni": nro_documento,
        "hcf": hcf,
        "adscripcion": list(
            dict.fromkeys(
                item.get("adscripcion")
                for item in results_query1
                if isinstance(item, dict) and item.get("adscripcion")
            )
        ),
        "fallecido": ciudadano.get("fallecido"),
    }


def consultar_familiar(data):

    dni = data["dni"]
    sexo = data["sexo"]

    persona = buscar_persona(dni=dni, sexo=sexo)
    ciudadano = None

    if not persona:
        ciudadano = consultar_ciudadano(dni=dni, sexo=sexo)

    return {
        "id": data["id"],
        "persona": _serializar_persona_consulta(persona),
        "ciudadano": ciudadano,
        "relaciones": consultar_relaciones(persona) if persona else [],
    }


def consultar_hcf(hcf):
    url = config("API_HCF", default="")
    api_key = config("HCF_PPVV_API_KEY", default="")
    if not url:
        return None

    try:
        session = requests.Session()
        session.trust_env = False
        response = session.get(
            url,
            params={"hcf": hcf},
            headers={
                "HCF_PPVV_API_KEY": api_key,
            },
            timeout=10,
        )

        response.raise_for_status()

        return response.json()

    except (requests.RequestException, ValueError, TypeError):
        logger.warning("No fue posible consultar la historia clínica familiar.")
        return None

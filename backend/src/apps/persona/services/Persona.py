"""Identidad local y actualización de los datos de salud recibidos."""
from ..models import Persona

DATOS_SALUD = (
    "hc", "hcf", "discapacidades", "consumos_problematicos", "intentos_de_suicidio",
    "problemas_socioambientales", "violencias",
)


def buscar_persona(dni: str, sexo: str | None = None) -> Persona | None:
    consulta = Persona.objects.filter(dni=dni)
    if sexo:
        consulta = consulta.filter(sexo=sexo)
    return consulta.order_by("id").first()


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

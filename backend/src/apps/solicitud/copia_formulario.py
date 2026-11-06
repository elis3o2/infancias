from dataclasses import dataclass

from django.utils import timezone

from src.apps.domicilio.models import Domicilio, Institucion
from src.apps.persona.models import RelacionAdolescente
from .models import Solicitud


@dataclass(frozen=True)
class SeccionFormulario:
    titulo: str
    campos: tuple[tuple[str, str], ...]


@dataclass(frozen=True)
class CopiaFormulario:
    numero: int
    fecha: str
    secciones: tuple[SeccionFormulario, ...]


def _domicilio(domicilio: Domicilio | None) -> str:
    if domicilio is None:
        return "No informado"
    departamento = domicilio.departamento
    partes = [domicilio.nombre, f"{departamento.nombre}, {departamento.provincia.nombre}"]
    if domicilio.observaciones:
        partes.append(f"Observaciones: {domicilio.observaciones}")
    return "\n".join(partes)


def _institucion(institucion: Institucion) -> str:
    return f"{institucion.nombre} ({institucion.tipo.nombre})\n{_domicilio(institucion.domicilio)}"


def capturar_formulario(solicitud: Solicitud) -> CopiaFormulario:
    """Instantánea del formulario declarado, sin datos posteriores de Persona."""
    fecha = solicitud.fecha_hora_creacion
    if timezone.is_aware(fecha):
        fecha = timezone.localtime(fecha)
    secciones = [SeccionFormulario("Datos de la solicitud", (
        ("Problemática", solicitud.motivo.nombre),
        ("Descripción", solicitud.descripcion or "No informada"),
        ("Correo", solicitud.correo or "No informado"),
        ("Teléfono", solicitud.telefono or "No informado"),
        ("Institución solicitante", _institucion(solicitud.institucion) if solicitud.institucion_id else "No informada"),
    ))]
    adolescentes = solicitud.adolescentes.select_related("domicilio__departamento__provincia").order_by("id")
    for indice, adolescente in enumerate(adolescentes, 1): 
        nombre = f"{adolescente.nombre} {adolescente.apellido}"
        secciones.append(SeccionFormulario(f"{indice}. Niña, niño o adolescente: {nombre}", (
            ("Nombre y apellido", nombre), ("Documento", adolescente.dni),
            ("Sexo", adolescente.sexo), ("Fecha de nacimiento", adolescente.fecha_nacimiento.strftime("%d-%m-%Y")),
            ("Escolarizado", "No informado" if adolescente.escolarizado is None else "Sí" if adolescente.escolarizado else "No"),
            ("Domicilio", _domicilio(adolescente.domicilio)),
        )))
        familiares = adolescente.familiares.select_related("vinculo", "domicilio__departamento__provincia").order_by("id")
        for numero, familiar in enumerate(familiares, 1):
            secciones.append(SeccionFormulario(f"{indice}.{numero}. Familiar / referente de {nombre}", (
                ("Nombre y apellido", f"{familiar.nombre} {familiar.apellido}"),
                ("Documento", familiar.dni or "No informado"), ("Sexo", familiar.sexo or "No informado"),
                ("Vínculo", familiar.vinculo.nombre if familiar.vinculo_id else "No informado"),
                ("Teléfono", familiar.telefono or "No informado"), ("Domicilio", _domicilio(familiar.domicilio)),
            )))
        if not familiares:
            secciones.append(SeccionFormulario(f"Familiares / referentes de {nombre}", (("Familiares", "No informados"),)))
        referencias = adolescente.referencias_instituciones.select_related(
            "institucion__tipo", "institucion__domicilio__departamento__provincia",
        ).order_by("id")
        secciones.append(SeccionFormulario(f"Instituciones de referencia de {nombre}",
            tuple(("Institución", _institucion(referencia.institucion)) for referencia in referencias)
            or (("Referencias", "No informadas"),)))

    relaciones = RelacionAdolescente.objects.filter(adolescente1__solicitud=solicitud).select_related(
        "adolescente1", "adolescente2", "vinculo",
    ).order_by("id")
    secciones.append(SeccionFormulario("Vínculos entre niños y adolescentes", tuple(
        (f"{relacion.adolescente1.nombre} {relacion.adolescente1.apellido} - {relacion.adolescente2.nombre} {relacion.adolescente2.apellido}", relacion.vinculo.nombre)
        for relacion in relaciones
    ) or (("Vínculos", "No informados"),)))
    # Se enumeran los archivos del formulario; no se reenvía su contenido.
    archivos = solicitud.archivos.order_by("id").values_list("nombre", flat=True)
    secciones.append(SeccionFormulario("Archivos adjuntados al formulario", tuple(
        ("Archivo", nombre) for nombre in archivos
    ) or (("Archivos", "No se adjuntaron archivos"),)))
    return CopiaFormulario(solicitud.pk, fecha.strftime("%d-%m-%Y %H:%M"), tuple(secciones))

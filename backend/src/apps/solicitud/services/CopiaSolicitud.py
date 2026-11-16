"""Instantánea del formulario y generación de su copia adjunta.

Oculta las consultas del formulario y su representación en PDF; los demás
servicios solo solicitan una instantánea o un adjunto.
"""
from io import BytesIO
from xml.sax.saxutils import escape

from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from src.apps.domicilio.models import Domicilio, Institucion
from src.apps.persona.models import RelacionAdolescente
from ..clases import CopiaFormulario, SeccionFormulario
from ..models import Solicitud


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


def generar_formulario_pdf(datos: CopiaFormulario) -> bytes:
    """Genera una copia legible en memoria, sin escribir archivos ni consultar APIs."""
    buffer = BytesIO()
    estilos = getSampleStyleSheet()
    cuerpo = ParagraphStyle("Formulario", parent=estilos["BodyText"], fontSize=10, leading=15, spaceAfter=6,
        textColor=colors.HexColor("#243746"), splitLongWords=True)
    seccion = ParagraphStyle("SeccionFormulario", parent=estilos["Heading2"], fontSize=12, leading=16,
        textColor=colors.HexColor("#176B78"), spaceBefore=16, spaceAfter=9, keepWithNext=True)
    titulo = ParagraphStyle("TituloFormulario", parent=estilos["Title"], alignment=0, fontSize=22, leading=28,
        textColor=colors.HexColor("#153C4A"), spaceAfter=12)

    def texto(valor: str) -> str:
        return escape(valor).replace("\r\n", "\n").replace("\r", "\n").replace("\n", "<br/>")

    def pagina(canvas, documento):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#D9E3E8"))
        canvas.line(20 * mm, 18 * mm, A4[0] - 20 * mm, 18 * mm)
        canvas.setFillColor(colors.HexColor("#526879"))
        canvas.setFont("Helvetica", 8)
        canvas.drawString(20 * mm, 13 * mm, f"Infancias - Copia del formulario ")
        canvas.drawRightString(A4[0] - 20 * mm, 13 * mm, f"Página {documento.page}")
        canvas.restoreState()

    contenido = [Paragraph("Copia del formulario enviado", titulo),
        Paragraph(f"Enviada: {texto(datos.fecha)}", cuerpo),
        Paragraph("Esta copia contiene los datos declarados al enviar la solicitud. No implica su validación ni aceptación.", cuerpo),
        Spacer(1, 4 * mm)]
    for apartado in datos.secciones:
        contenido.append(Paragraph(texto(apartado.titulo), seccion))
        for etiqueta, valor in apartado.campos:
            contenido.append(Paragraph(f"<b>{texto(etiqueta)}:</b> {texto(valor)}", cuerpo))
    SimpleDocTemplate(buffer, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=18 * mm, bottomMargin=25 * mm, title=f"Solicitud {datos.numero} - Copia del formulario",
        author="Infancias").build(contenido, onFirstPage=pagina, onLaterPages=pagina)
    return buffer.getvalue()


def crear_adjunto_formulario(datos: CopiaFormulario) -> SimpleUploadedFile:
    return SimpleUploadedFile(
        f"solicitud-{datos.numero}.pdf", generar_formulario_pdf(datos),
        content_type="application/pdf",
    )

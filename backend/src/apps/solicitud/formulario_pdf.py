from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from .copia_formulario import CopiaFormulario


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

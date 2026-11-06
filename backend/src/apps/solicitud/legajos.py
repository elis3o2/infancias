"""Números de consulta: nunca crea ni modifica legajos o carpetas."""


def legajos_solicitud(solicitud):
    if not solicitud.validado:
        return []
    resultado = []
    for adolescente in solicitud.adolescentes.all():
        persona = adolescente.persona
        if persona is None:
            continue
        legajo = persona.legajo
        resultado.append({
            "id_adolescente": adolescente.pk,
            "nombre": f"{persona.nombre} {persona.apellido}".strip(),
            "legajo": legajo.numero if legajo else None,
            "carpeta": legajo.carpeta.numero if legajo else None,
        })
    return resultado

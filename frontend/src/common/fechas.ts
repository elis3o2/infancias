// La presentación no depende del idioma ni de la zona horaria del navegador.
export function esFechaISO(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const [anio, mes, dia] = valor.split("-").map(Number)
  const bisiesto = anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0)
  const dias = [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return anio >= 1 && mes >= 1 && mes <= 12 && dia >= 1 && dia <= dias[mes - 1]
}

export function fechaAISO(texto: string): string {
  const partes = /^(\d{2})-(\d{2})-(\d{4})$/.exec(texto)
  if (!partes) return ""
  const iso = `${partes[3]}-${partes[2]}-${partes[1]}`
  return esFechaISO(iso) ? iso : ""
}

function leerFecha(valor: string): { fecha: string; hora: string } | null {
  const iso = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(valor)
  if (iso) {
    if (!esFechaISO(iso[1]) || Number(iso[2] ?? 0) > 23 || Number(iso[3] ?? 0) > 59 || Number(iso[4] ?? 0) > 59) return null
    // Conservamos el día y la hora informados por la API, incluso con offset.
    return { fecha: iso[1], hora: iso[2] ? `${iso[2]}:${iso[3]}` : "" }
  }
  // Ciudadano también devuelve nacimientos en RFC 1123 con zona GMT explícita.
  if (!/^[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(valor)) return null
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return null
  return { fecha: fecha.toISOString().slice(0, 10), hora: fecha.toISOString().slice(11, 16) }
}

function formatear(valor: string | null | undefined, conHora: boolean): string {
  const partes = valor ? leerFecha(valor) : null
  if (!partes) return "—"
  const [anio, mes, dia] = partes.fecha.split("-")
  return `${dia}-${mes}-${anio}${conHora && partes.hora ? ` ${partes.hora}` : ""}`
}

export const formatFecha = (valor: string | null | undefined): string => formatear(valor, false)
export const formatFechaHora = (valor: string | null | undefined): string => formatear(valor, true)

export function validarFechaIngresada(texto: string, max?: string): string {
  if (!texto) return ""
  const iso = fechaAISO(texto)
  if (!iso) return "Ingresá una fecha válida en formato DD-MM-AAAA."
  return max && iso > max ? `La fecha no puede ser posterior a ${formatFecha(max)}.` : ""
}

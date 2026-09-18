export function formatFecha(str: string | null | undefined): string {
  if (!str) return "—"
  try {
    const fecha = new Date(str)
    if (isNaN(fecha.getTime())) return str
    const dia = String(fecha.getUTCDate()).padStart(2, "0")
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0")
    const anio = fecha.getUTCFullYear()
    return `${dia}-${mes}-${anio}`
  } catch {
    return str
  }
}
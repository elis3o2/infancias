export const formatFecha = (fecha: string) => {
  try {
    const d = new Date(fecha)
    const dia = d.getUTCDate().toString().padStart(2, "0")
    const mes = d.toLocaleString("es-AR", { month: "long", timeZone: "UTC" })
    const anio = d.getUTCFullYear()
    return `${dia} de ${mes} de ${anio}`
  } catch {
    return fecha
  }
}

import { isAxiosError } from "axios"

type ErrorEncontrado = { mensaje: string; ruta: (string | number)[] }

const colecciones: Record<string, string> = {
  adolescentes: "Adolescente",
  familiares: "Familiar",
  relaciones_adolescentes: "Vínculo entre adolescentes",
  referencias_instituciones_data: "Institución de referencia",
}

const campos: Record<string, string> = {
  dni: "DNI", sexo: "Sexo", nombre: "Nombre", apellido: "Apellido",
  fecha_nacimiento: "Fecha de nacimiento", domicilio: "Domicilio",
  id_departamento: "Departamento", institucion: "Institución",
  id_institucion: "Institución", id_tipo: "Tipo de institución",
  id_vinculo: "Vínculo", vinculo: "Vínculo", salud: "Salud", legajo: "Legajo",
}

function buscarMensaje(data: unknown, ruta: ErrorEncontrado["ruta"] = []): ErrorEncontrado | null {
  if (typeof data === "string") return data.trim() ? { mensaje: data.trim(), ruta } : null
  if (!data || typeof data !== "object") return null

  const entradas = Array.isArray(data) ? [...data.entries()] : Object.entries(data)
  for (const [campo, valor] of entradas) {
    const encontrado = buscarMensaje(valor, [...ruta, campo])
    if (encontrado) return encontrado
  }
  return null
}

/** Muestra un error legible y ubica al adolescente o familiar cuando está anidado. */
export function getSolicitudErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback

  const response = (error as { response?: { data?: unknown } }).response
  if (!response) {
    return error instanceof Error && !isAxiosError(error)
      ? error.message.trim() || fallback
      : fallback
  }
  const data = response.data
  if (data && typeof data === "object" && "detail" in data && typeof data.detail === "string") {
    if (data.detail.trim()) return data.detail.trim()
  }
  const encontrado = buscarMensaje(data)
  if (!encontrado) return fallback

  const { mensaje, ruta } = encontrado
  if (ruta.filter((campo) => typeof campo === "string").length < 2) return mensaje
  const contexto = ruta.flatMap((campo, index) => {
    if (typeof campo !== "string" || campo === "non_field_errors" || campo === "detail") return []
    const indice = ruta[index + 1]
    if (colecciones[campo] && typeof indice === "number") return [`${colecciones[campo]} ${indice + 1}`]
    return [campos[campo] ?? campo.replaceAll("_", " ")]
  })
  return contexto.length ? `${contexto.join(" · ")}: ${mensaje}` : mensaje
}

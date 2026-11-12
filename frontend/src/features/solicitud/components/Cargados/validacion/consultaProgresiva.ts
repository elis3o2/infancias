import { getCiudadanoData } from "@/features/api_externa/api"
import type { RespCiudadano } from "@/features/api_externa/types"

type Identidad = { id: number; dni: string; sexo: "M" | "F" }
export type PersonasConsulta = { adolescentes: Identidad[]; familiares: Identidad[] }
const clave = (dni: string | number, sexo: string) => `${String(dni).trim()}:${sexo}`
const unicos = (personas: Identidad[]) => [...new Map(personas.map((persona) => [persona.id, persona])).values()]

export function obtenerPendientes(personas: PersonasConsulta, respuesta: RespCiudadano | null): PersonasConsulta {
  return {
    adolescentes: unicos(personas.adolescentes).filter((persona) => !respuesta?.adolescentes.some((item) => item.id === persona.id)),
    familiares: unicos(personas.familiares).filter((persona) => !respuesta?.familiares.some((item) => item.id === persona.id)),
  }
}

function unirResultados(anteriores: RespCiudadano, nuevos: RespCiudadano, personas: PersonasConsulta): RespCiudadano {
  const adolescentes = [...anteriores.adolescentes, ...nuevos.adolescentes]
  const familiares = [...anteriores.familiares, ...nuevos.familiares]
  const identidades = new Set([...personas.adolescentes, ...personas.familiares].map((item) => clave(item.dni, item.sexo)))
  const historias = new Set([...adolescentes, ...familiares].flatMap((item) => {
    const hc = (item.persona ?? item.ciudadano)?.hc
    return hc == null ? [] : [String(hc)]
  }))
  const miembros = new Map([...anteriores.hcf, ...nuevos.hcf].map((item) => [item.numeroHCI, item]))
  return {
    adolescentes, familiares,
    hcf: [...miembros.values()].filter((item) =>
      !identidades.has(clave(item.DNI, item.sexo)) && !historias.has(String(item.numeroHCI)),
    ),
  }
}

/** Una identidad por petición, sin reintentos ni almacenamiento persistente. */
export async function consultarPorEtapas(
  personas: PersonasConsulta,
  anteriores: RespCiudadano | null,
  onResultado: (acumulado: RespCiudadano) => void,
  signal?: AbortSignal,
  consultar = getCiudadanoData,
): Promise<RespCiudadano> {
  let acumulado: RespCiudadano = anteriores ?? { adolescentes: [], familiares: [], hcf: [] }
  const pendientes = obtenerPendientes(personas, acumulado)
  const grupos = new Map<string, PersonasConsulta>()
  for (const tipo of ["adolescentes", "familiares"] as const) {
    for (const persona of pendientes[tipo]) {
      const identidad = clave(persona.dni, persona.sexo)
      const grupo = grupos.get(identidad) ?? { adolescentes: [], familiares: [] }
      grupo[tipo].push(persona)
      grupos.set(identidad, grupo)
    }
  }
  for (const grupo of grupos.values()) {
    signal?.throwIfAborted()
    const respuesta = await consultar(grupo.adolescentes, grupo.familiares, signal)
    signal?.throwIfAborted()
    for (const tipo of ["adolescentes", "familiares"] as const) {
      if (grupo[tipo].some((persona) => !respuesta[tipo].some((item) => item.id === persona.id))) {
        throw new Error("La consulta devolvió una respuesta incompleta. Los datos obtenidos anteriormente se conservaron.")
      }
    }
    acumulado = unirResultados(acumulado, respuesta, personas)
    onResultado(acumulado)
  }
  return acumulado
}

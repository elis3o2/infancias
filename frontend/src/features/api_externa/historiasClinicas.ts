import { getHistoriaClinica } from "./api"
import type { HCFResponse, PersonaHistoriaFamiliar } from "./types"
import { obtenerDatosSalud, type SaludConsulta } from "../persona/salud"

export type ConsultaHistoria = { datos: HCFResponse | null } | { error: true }
export type HistoriasConsultadas = ReadonlyMap<number, ConsultaHistoria>

export function numeroHC(valor: SaludConsulta["hc"]): number | null {
  const numero = Number(valor)
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null
}

export function historiaResuelta(hci: number, consultas: HistoriasConsultadas): boolean {
  const consulta = consultas.get(hci)
  return [...consultas.values()].some((item) => "datos" in item &&
    item.datos?.resultados.some((persona) => numeroHC(persona.numeroHCI) === hci)) ||
    Boolean(consulta && "datos" in consulta)
}

/** Peticiones secuenciales; una HCF puede resolver varias HC individuales. */
export async function consultarHistoriasPorEtapas(
  hcis: number[], anteriores: HistoriasConsultadas,
  onResultado: (datos: HistoriasConsultadas) => void, signal: AbortSignal,
  consultar = getHistoriaClinica,
): Promise<HistoriasConsultadas> {
  const acumulado = new Map(anteriores)
  for (const hci of new Set(hcis)) {
    signal.throwIfAborted()
    if (historiaResuelta(hci, acumulado) || acumulado.has(hci)) continue
    try {
      const datos = await consultar(hci, signal)
      signal.throwIfAborted()
      acumulado.set(hci, { datos })
    } catch {
      signal.throwIfAborted()
      acumulado.set(hci, { error: true })
    }
    onResultado(new Map(acumulado))
  }
  return acumulado
}

export function integrantesHistorias(consultas: HistoriasConsultadas): PersonaHistoriaFamiliar[] {
  const integrantes = new Map<number, PersonaHistoriaFamiliar>()
  for (const consulta of consultas.values()) {
    if (!("datos" in consulta) || !consulta.datos) continue
    for (const persona of consulta.datos.resultados) {
      if (numeroHC(persona.numeroHCI) !== null) {
        integrantes.set(Number(persona.numeroHCI), { ...persona, hcf: numeroHC(consulta.datos.hcf) })
      }
    }
  }
  return [...integrantes.values()]
}

/** Solo cambia salud; nunca reemplaza identidad, vínculo, domicilio o legajo. */
export function aplicarSalud<T extends SaludConsulta>(
  persona: T, dni: string | number, sexo: string, consultas: HistoriasConsultadas,
): T {
  const integrante = integrantesHistorias(consultas).find((item) =>
    numeroHC(item.numeroHCI) === numeroHC(persona.hc) &&
    String(item.DNI).trim() === String(dni).trim() && item.sexo === sexo,
  )
  if (!integrante) return persona
  return { ...persona, ...obtenerDatosSalud({
    hc: persona.hc, hcf: numeroHC(integrante.hcf) ?? persona.hcf,
    discapacidades: integrante.flag_discapacidades,
    consumos_problematicos: integrante.flag_consumos_problematicos,
    intentos_de_suicidio: integrante.flag_intentos_de_suicidio,
    problemas_socioambientales: integrante.flag_problemas_socioambientales,
    violencias: integrante.flag_violencias,
  }) }
}

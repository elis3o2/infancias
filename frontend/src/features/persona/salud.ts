export const indicadoresSalud = [
  ["discapacidades", "Discapacidades"],
  ["consumos_problematicos", "Consumos problemáticos"],
  ["intentos_de_suicidio", "Intentos de suicidio"],
  ["problemas_socioambientales", "Problemas socioambientales"],
  ["violencias", "Violencias"],
] as const

type IndicadorSalud = typeof indicadoresSalud[number][0]

export type DatosSalud = Readonly<{
  hc?: number | null
  hcf?: number | null
} & Partial<Record<IndicadorSalud, boolean>>>

export type SaludConsulta = Readonly<{
  hc?: number | string | null
  hcf?: number | string | null
} & Partial<Record<IndicadorSalud, boolean | 0 | 1>>>

export function obtenerDatosSalud(origen: SaludConsulta): DatosSalud {
  const numero = (valor: number | string | null | undefined): number | null => {
    if (valor === null || valor === undefined || valor === "") return null
    const convertido = Number(valor)
    if (!Number.isSafeInteger(convertido) || convertido < 0) return null
    return convertido
  }
  const indicadores: Partial<Record<IndicadorSalud, boolean>> = {}
  for (const [campo] of indicadoresSalud) {
    const valor = origen[campo]
    if (typeof valor === "boolean" || valor === 0 || valor === 1) indicadores[campo] = Boolean(valor)
  }
  return { hc: numero(origen.hc), hcf: numero(origen.hcf), ...indicadores }
}

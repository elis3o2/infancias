import type { AdolescenteResp, FamiliarResp, RespCiudadano } from "@/features/api_externa/types"
import { aplicarSalud, integrantesHistorias, numeroHC, type HistoriasConsultadas } from "@/features/api_externa/historiasClinicas"
import type { Revisiones } from "./types"
import type { PersonasConsulta } from "./consultaProgresiva"

export function completarResultado<T extends AdolescenteResp | FamiliarResp>(item: T, historias: HistoriasConsultadas): T {
  return { ...item,
    persona: item.persona ? aplicarSalud(item.persona, item.persona.dni, item.persona.sexo, historias) : null,
    ciudadano: item.ciudadano ? aplicarSalud(item.ciudadano, item.ciudadano.nroDocumento, item.ciudadano.sexo, historias) : null,
  }
}

export function completarConsulta(datos: RespCiudadano, personas: PersonasConsulta, historias: HistoriasConsultadas): RespCiudadano {
  const identidades = new Set([...personas.adolescentes, ...personas.familiares].map((item) => `${item.dni}:${item.sexo}`))
  const hcis = new Set([...datos.adolescentes, ...datos.familiares].map((item) => numeroHC((item.persona ?? item.ciudadano)?.hc)))
  return {
    adolescentes: datos.adolescentes.map((item) => completarResultado(item, historias)),
    familiares: datos.familiares.map((item) => completarResultado(item, historias)),
    hcf: integrantesHistorias(historias).filter((item) =>
      !hcis.has(numeroHC(item.numeroHCI)) && !identidades.has(`${String(item.DNI).trim()}:${item.sexo}`)),
  }
}

/** Incluye la salud que llegó después de confirmar, conservando todos los campos editados. */
export function completarRevisiones(revisiones: Revisiones, historias: HistoriasConsultadas): Revisiones {
  return Object.fromEntries(Object.entries(revisiones).map(([id, revision]) => [id, {
    ...revision,
    persona: revision.persona ? aplicarSalud(revision.persona, revision.persona.dni, revision.persona.sexo, historias) : null,
    familiares: revision.familiares.map((familiar) => ({ ...familiar, persona: familiar.persona
      ? aplicarSalud(familiar.persona, familiar.persona.dni, familiar.persona.sexo, historias) : null })),
  }]))
}

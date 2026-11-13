import type { PersonaHistoriaFamiliar } from "@/features/api_externa/types"
import type { PersonaCreate, Vinculo } from "@/features/persona/types"
import { obtenerDatosSalud } from "@/features/persona/salud"
import { esFechaISO } from "@/common/fechas"
import { personaValidacionInput } from "../../../personasPayload"
import type { AdolescenteSolicitud } from "../../../types"
import type { AdolescenteRevision } from "./types"

export type AdolescenteDestino = Pick<AdolescenteSolicitud, "id" | "nombre" | "apellido" | "dni" | "sexo">
type Identidad = Pick<PersonaCreate, "dni" | "sexo">

export function saludDesdeHistoria(integrante: PersonaHistoriaFamiliar) {
  return obtenerDatosSalud({
    hc: integrante.numeroHCI, hcf: integrante.hcf,
    discapacidades: integrante.flag_discapacidades,
    consumos_problematicos: integrante.flag_consumos_problematicos,
    intentos_de_suicidio: integrante.flag_intentos_de_suicidio,
    problemas_socioambientales: integrante.flag_problemas_socioambientales,
    violencias: integrante.flag_violencias,
  })
}

export function errorIdentidadHistoria(integrante: PersonaHistoriaFamiliar): string | null {
  if (!/^\d{7,9}$/.test(integrante.DNI?.trim() ?? "") ||
    !["M", "F"].includes(integrante.sexo) || !integrante.nombre?.trim() || !integrante.apellido?.trim() ||
    !integrante.fechaNacimiento || !esFechaISO(integrante.fechaNacimiento)) {
    return "Los datos de identidad de este integrante están incompletos o no son válidos para agregarlo como familiar."
  }
  return null
}

/** Reutiliza el registro HCF: no consulta identidad, salud ni antecedentes. */
export function familiarDesdeHistoria(integrante: PersonaHistoriaFamiliar, vinculo: Vinculo | null): PersonaCreate {
  const error = errorIdentidadHistoria(integrante)
  if (error) throw new Error(error)
  if (!vinculo || !Number.isInteger(vinculo.id) || vinculo.id < 1) throw new Error("Seleccioná el vínculo con el adolescente.")
  const persona: PersonaCreate = {
    nombre: integrante.nombre.trim(), apellido: integrante.apellido.trim(), dni: integrante.DNI.trim(),
    sexo: integrante.sexo, fecha_nacimiento: integrante.fechaNacimiento,
    ...saludDesdeHistoria(integrante),
    vinculo, id_vinculo: vinculo.id, telefono: null, domicilio: null, legajo: null,
  }
  // Mantener la misma validación que se aplica al enviar la solicitud.
  personaValidacionInput(persona)
  return persona
}

function mismaIdentidad(datos: { dni: string | null; sexo: string | null } | null, persona: Identidad) {
  const dni = persona.dni?.trim()
  return Boolean(dni) && datos?.dni?.trim() === dni && datos?.sexo === persona.sexo
}

export function familiarYaAsociado(revision: AdolescenteRevision | undefined, persona: Identidad): boolean {
  return revision?.familiares.some((familiar) => mismaIdentidad(familiar.persona ?? familiar.original, persona)) ?? false
}

export function puedeAgregarFamiliar(adolescente: AdolescenteDestino, revision: AdolescenteRevision | undefined, persona: Identidad): boolean {
  return Boolean(revision) && !mismaIdentidad(adolescente, persona) && !mismaIdentidad(revision?.persona ?? null, persona)
    && !familiarYaAsociado(revision, persona)
}

export function nombreDestino(adolescente: AdolescenteDestino, revision: AdolescenteRevision | undefined): string {
  const datos = revision?.estado === "confirmado" && revision.persona ? revision.persona : adolescente
  return `${datos.nombre} ${datos.apellido}`
}

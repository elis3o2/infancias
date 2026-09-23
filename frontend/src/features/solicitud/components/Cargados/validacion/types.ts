import type { Familiar, PersonaCreate } from "@/features/persona/types"
import type { SaludDatosInput } from "../../../types"

export type EstadoValidacion = "confirmado" | "rechazado" | null

export type FamiliarRevision = {
  original: Familiar | null
  estado: EstadoValidacion
  persona: PersonaCreate | null
  salud: SaludDatosInput
}

export type AdolescenteRevision = {
  estado: EstadoValidacion
  persona: PersonaCreate | null
  legajoRegistrado: boolean
  salud: SaludDatosInput
  familiares: FamiliarRevision[]
}

export type Revisiones = Record<number, AdolescenteRevision>

export type CambioRevision = Partial<AdolescenteRevision> | ((revision: AdolescenteRevision) => Partial<AdolescenteRevision>)

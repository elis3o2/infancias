import type { DomicilioInput, InstitucionInput } from "../domicilio/types"
import type { AdolescenteInput } from "../persona/types"
import type { DatosSalud } from "../persona/salud"

export type AdolescenteSolicitudInput = AdolescenteInput

export type InstitucionSolicitudInput = (
  | { id_institucion: number; institucion?: never }
  | { institucion: Exclude<InstitucionInput, { id_institucion: number }>; id_institucion?: never }
)



export type PersonaValidacionInput = DatosSalud & {
  nombre: string
  apellido: string
  dni: string
  sexo: "M" | "F"
  fecha_nacimiento: string
}

export type LegajoValidacionInput = {
  id?: number
  id_insert?: number | null
  carpeta_id?: number | null
}

export type FamiliarValidacionInput = {
  id?: number
  persona: PersonaValidacionInput
  id_vinculo: number
  telefono?: string | null
  domicilio?: DomicilioInput | null
}

export type AdolescenteValidacionInput = {
  id: number
  persona: PersonaValidacionInput
  familiares: FamiliarValidacionInput[]
  legajo?: LegajoValidacionInput | null
}

export type SolicitudValidacionInput = {
  descripcion_extra: string
  adolescentes: AdolescenteValidacionInput[]
}

export type FamiliarAdmisionInput = Omit<FamiliarValidacionInput, "id"> & {
  id_adolescente: number
}

export type AdolescenteAdmisionInput = FamiliarAdmisionInput & {
  domicilio: DomicilioInput
  legajo?: LegajoValidacionInput | null
}

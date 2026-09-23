import type { DomicilioInput, InstitucionInput } from "../domicilio/types"
import type { AdolescenteInput } from "../persona/types"

export type AdolescenteSolicitudInput = AdolescenteInput

export type InstitucionSolicitudInput = (
  | { id_institucion: number; institucion?: never }
  | { institucion: Exclude<InstitucionInput, { id_institucion: number }>; id_institucion?: never }
)



export type SaludDatosInput = {
  hcf?: number | null
  discapacidades?: boolean
  consumos_problematicos?: boolean
  intentos_de_suicidio?: boolean
  problemas_socioambientales?: boolean
  violencias?: boolean
}

export type LegajoValidacionInput = {
  id?: number
  id_insert?: number | null
  carpeta_id?: number | null
}

export type FamiliarValidacionInput = {
  id?: number
  dni: string
  sexo: "M" | "F"
  id_vinculo: number
  telefono?: string | null
  domicilio?: DomicilioInput | null
  salud?: SaludDatosInput
}

export type AdolescenteValidacionInput = {
  id: number
  salud: SaludDatosInput
  familiares: FamiliarValidacionInput[]
  legajo?: LegajoValidacionInput | null
}

export type SolicitudValidacionInput = {
  descripcion_extra: string
  adolescentes: AdolescenteValidacionInput[]
}

import type { InstitucionFormData } from "@/features/domicilio/types"
import type { AdolescenteCreate, FamiliarCreate, Vinculo } from "@/features/persona/types"

export type ReferenciaFormulario = InstitucionFormData & { id_temp?: string }

export type AdolescenteFormulario = {
  id_temp: string
  datos: AdolescenteCreate
  referencias: ReferenciaFormulario[]
  familiares: FamiliarCreate[]
  relacion: { id_temp: string; vinculo: Vinculo } | null
}

export const nombreAdolescente = (adolescente: AdolescenteFormulario) =>
  `${adolescente.datos.nombre} ${adolescente.datos.apellido}`.trim()

let siguienteId = 0
export const crearIdTemporal = () => `adolescente-${Date.now()}-${++siguienteId}`

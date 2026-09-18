import type { DomicilioInput, Institucion, InstitucionInput } from "../domicilio/types"
import type {
  AdolescenteCrud,
  AdolescenteInput,
  Equipo,
  Familiar,
  FamiliarInput,
  Persona,
  PersonaCreate,
  RelacionResp,
} from "../persona/types"

export type MotivoSolicitud = {
  id: number
  nombre: string
}

/**
 * Archivo seleccionado localmente, antes de crear la solicitud.
 * The numeric id is only used as a stable React key during this form.
 */
export type Archivo = {
  id: number
  nombre: string
  tipo_mime: string
  contenido: File
}

export type ArchivoSimple = {
  id: number
  nombre: string
  tipo_mime: string
}

/**
 * A reference institution can be an existing record or a complete new one.
 * The API expects `id` for existing references (not `id_institucion`).
 */
export type ReferenciaInstitucionInput =
  | { id: number }
  | Exclude<InstitucionInput, { id_institucion: number }>

export type SolicitudCreate = {
  adolescentes: AdolescenteInput[]
  familiares: FamiliarInput[]
  referencias_instituciones_data: ReferenciaInstitucionInput[]
  id_motivo: number
  correo: string
  telefono: string
  descripcion: string
  archivos: File[]
} & (
  | { id_institucion: number; institucion?: never }
  | { institucion: InstitucionInput; id_institucion?: never }
)

/**
 * Shared detail returned by the API for pending, validated and rejected
 * requests. Keeping the person fields available in every state lets the
 * detail screens use one predictable shape instead of the former mix of
 * `adolescente` and `adolescentes`.
 */
export type AdolescenteSolicitud = AdolescenteCrud & {
  persona: Persona | null
  relaciones: RelacionResp[]
}

type SolicitudDetalleBase = {
  id: number
  institucion: Institucion
  adolescentes: AdolescenteSolicitud[]
  familiares: Familiar[]
  /** Personas confirmadas como familiares o referentes, una sola vez por solicitud. */
  familiares_validados: Persona[]
  referencias_instituciones: Institucion[]
  motivo: MotivoSolicitud
  descripcion: string
  archivos: ArchivoSimple[]
  fecha_hora_creacion: string
  fecha_hora_entrada: string | null
  fecha_hora_admision: string | null
  equipo: Equipo | null
  telefono: string
  correo: string
}

export type SolicitudCrud = SolicitudDetalleBase & {
  validado: false
  rechazado: false
  descripcion_extra?: string | null
  motivo_rechazo?: null
}

export type Solicitud = SolicitudDetalleBase & {
  validado: true
  rechazado: false
  descripcion_extra: string | null
  motivo_rechazo?: null
}

export type SolicitudRechazada = SolicitudDetalleBase & {
  validado: false
  rechazado: true
  descripcion_extra?: string | null
  motivo_rechazo: string
}

export type SolicitudDetalle =
  | SolicitudCrud
  | Solicitud
  | SolicitudRechazada

export type SolicitudSimple = {
  id: number
  motivo: MotivoSolicitud
  fecha_hora_creacion: string
  fecha_hora_modificacion?: string | null
  validado: boolean
  rechazado: boolean
  equipo?: Equipo | null
}

/** Persona limpia de campos exclusivos de la interfaz, lista para la API. */
export type PersonaValidacionInput = Omit<
  Pick<
    PersonaCreate,
    | "nombre"
    | "apellido"
    | "dni"
    | "fecha_nacimiento"
    | "sexo"
    | "telefono"
    | "domicilio"
    | "legajo"
  >,
  "domicilio"
> & {
  domicilio: DomicilioInput | null
}

/** Extra fields used only while a caseworker validates a request. */
export type FamiliarValidacionInput = PersonaValidacionInput & {
  id_familiar?: number
  id_vinculo: number
}

export type AdolescenteValidacionInput =
  | {
      id: number
      estado: "confirmado"
      adolescente_validado: PersonaValidacionInput
      familiares_validados?: FamiliarValidacionInput[]
      /** IDs de familiares de la solicitud que se revisaron y rechazaron. */
      familiares_rechazados?: number[]
    }
  | {
      id: number
      estado: "rechazado"
    }

export type SolicitudValidacionInput = {
  descripcion_extra: string
  adolescentes: AdolescenteValidacionInput[]
}

export type ArchivoPendiente = {
  id: string
  file: File
}

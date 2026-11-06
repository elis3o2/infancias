import type { Institucion, InstitucionInput } from "../domicilio/types"
import type {
  AdolescenteCrud,
  AdolescenteInput,
  Equipo,
  Familiar,
  Persona,
  RelacionAdolescenteInput,
  Vinculo,
} from "../persona/types"

export type MotivoSolicitud = {
  id: number
  nombre: string
}


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


export type SolicitudCreate = {
  adolescentes: AdolescenteInput[]
  relaciones_adolescentes: RelacionAdolescenteInput[]
  id_motivo: number
  correo: string
  telefono: string
  descripcion: string
  archivos: File[]
} & (
  | { id_institucion: number; institucion?: never }
  | { institucion: Exclude<InstitucionInput, { id_institucion: number }>; id_institucion?: never }
)


export type {
  AdolescenteSolicitudInput, PersonaValidacionInput, LegajoValidacionInput, FamiliarValidacionInput,
  AdolescenteValidacionInput, SolicitudValidacionInput,
} from "./contracts"
export type { RelacionAdolescenteInput } from "../persona/types"
export type { ReferenciaInstitucionInput } from "../domicilio/types"

/**
 * Shared detail returned by the API for pending, validated and rejected
 * requests. Keeping the person fields available in every state lets the
 * detail screens use one predictable shape instead of the former mix of
 * `adolescente` and `adolescentes`.
 */
export type AdolescenteSolicitud = AdolescenteCrud & {
  persona: Persona | null
  relaciones: { id: number; vinculo: Vinculo; persona: Persona }[]
  familiares: Familiar[]
  referencias_instituciones: Institucion[]
}

export type RelacionAdolescente = {
  id: number
  adolescente1: number
  adolescente2: number
  vinculo: Vinculo
}

type SolicitudDetalleBase = {
  id: number
  institucion: Institucion | null
  adolescentes: AdolescenteSolicitud[]
  relaciones_adolescentes: RelacionAdolescente[]
  familiares: Familiar[]
  /** Personas confirmadas como familiares o referentes, una sola vez por solicitud. */
  familiares_validados: Persona[]
  /** Compatibilidad de lectura con respuestas históricas; las referencias actuales son de adolescentes. */
  referencias_instituciones?: Institucion[]
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
  comentarios?: SolicitudComentario[]
  puede_comentar?: boolean
  validado: false
  rechazado: false
  descripcion_extra?: string | null
  motivo_rechazo?: null
}

export type SolicitudComentario = {
  id: number
  comentario: string
  fecha_hora_creacion: string
  fecha_hora_ultmod: string
  usuario: number
  usuario_nombre: string
  puede_editar: boolean
}

export type Solicitud = SolicitudDetalleBase & {
  validado: true
  rechazado: false
  descripcion_extra: string | null
  motivo_rechazo?: null
  comentarios: SolicitudComentario[]
  puede_comentar: boolean
  puede_agregar_personas: boolean
}

export type SolicitudRechazada = SolicitudDetalleBase & {
  validado: false
  rechazado: true
  descripcion_extra?: string | null
  motivo_rechazo: string
  comentarios: SolicitudComentario[]
  puede_comentar: boolean
}

export type SolicitudDetalle =
  | SolicitudCrud
  | Solicitud
  | SolicitudRechazada

export type SolicitudSimple = {
  id: number
  titulo: string
  motivo: MotivoSolicitud
  fecha_hora_creacion: string
  fecha_hora_modificacion?: string | null
  validado: boolean
  rechazado: boolean
  equipo?: Equipo | null
}

export type ArchivoPendiente = {
  id: string
  file: File
}

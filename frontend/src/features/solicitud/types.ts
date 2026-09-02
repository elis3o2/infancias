import type { Institucion, InstitucionInput } from "../domicilio/types"
import type { Adolescente, AdolescenteCrud, AdolescenteInput, Equipo } from "../persona/types"

export type MotivoSolicitud = {
    id: number
    nombre: string
}

export type PrioridadSolicitud = {
    id: number,
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


export type SolicitudCrud = {
    id: number
    institucion: Institucion
    adolescente: AdolescenteCrud
    motivo: MotivoSolicitud
    prioridad: PrioridadSolicitud
    descripcion: string
    archivos: ArchivoSimple[]
    fecha_hora_creacion: string
    validado: false
    rechazado: false
    equipo: Equipo
    telefono: string 
    correo: string
}

export type Solicitud = {
    id: number
    institucion: Institucion
    adolescente: Adolescente 
    motivo: MotivoSolicitud
    prioridad: PrioridadSolicitud
    descripcion: string
    descripcion_extra: string
    archivos: ArchivoSimple[]
    fecha_hora_creacion: string
    fecha_hora_entrada: string
    fecha_hora_admision: string | null
    validado: true
    rechazado: false
    equipo: Equipo
    telefono: string 
    correo: string
}


export type SolicitudRechazada = {
    id: number
    institucion: Institucion
    adolescente: AdolescenteCrud 
    motivo: MotivoSolicitud
    prioridad: PrioridadSolicitud
    descripcion: string
    archivos: ArchivoSimple[]
    fecha_hora_creacion: string
    fecha_hora_entrada: string
    validado: false
    rechazado: true
    motivo_rechazo: string
    equipo: Equipo
    telefono: string 
    correo: string
}

export type SolicitudCreate = {
  adolescente: AdolescenteInput
  id_motivo: number
  id_prioridad: number
  correo: string
  telefono: string
  descripcion: string
  archivos: File[]
} & (
  | { id_institucion: number; institucion?: never }
  | { institucion: InstitucionInput; id_institucion?: never }
)


export type SolicitudSimple = {
    id: number
    motivo: MotivoSolicitud
    prioridad: PrioridadSolicitud
    fecha_hora_creacion: string
    fecha_hora_modificacion: string | null
    validado: boolean
    rechazado: boolean
    equipo: Equipo | null
}


export type ArchivoPendiente = {
  id: string       // id temporal, solo del lado del cliente
  file: File
}
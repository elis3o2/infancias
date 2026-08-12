import type { Institucion } from "../domicilio/types"
import type { Adolescente, AdolescenteCreate, Hermano, Solicitante } from "../persona/types"

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

export type Derivacion = {
    id: number 
    nombre: string
}

export type Solicitud = {
    id: number
    institucion: Institucion
    solicitante: Solicitante
    adolescente: Adolescente
    hermanos: Hermano[]
    motivo: MotivoSolicitud
    prioridad: PrioridadSolicitud
    descripcion: string
    archivos: ArchivoSimple[]
    fecha_hora_creacion: string
    fecha_hora_modificacion: string | null
    validado: boolean
    rechazado: boolean
    motivo_rechazo: string | null 
    derivacion: Derivacion | null
}


export type SolicitudCreate = {
    id_institucion?: number | null
    institucion?: Institucion | null
    solicitante: Solicitante
    adolescente: AdolescenteCreate
    id_motivo: number
    id_prioridad: number
    correo: string
    telefono: string
    descripcion: string
    archivos: File[]
}

export type SolicitudSimple = {
    id: number
    motivo: MotivoSolicitud
    prioridad: PrioridadSolicitud
    fecha_hora_creacion: string
    fecha_hora_modificacion: string | null
    validado: boolean
    rechazado: boolean
    derivacion: Derivacion | null
}

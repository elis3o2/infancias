import type { Institucion, InstitucionCreate } from "../domicilio/types"
import type { Adolescente, Hermano, Solicitante } from "../persona/types"

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

export type Solicitud = {
    id: number
    institucion: Institucion
    solicitante: Solicitante
    adolescente: Adolescente
    hermanos: Hermano[]
    motivo: MotivoSolicitud
    prioridad: PrioridadSolicitud
    descripcion: string
    archivos: Archivo[]
    fecha_hora_creacion: string
    fecha_hora_cambio: string | null
    validado: boolean
    rechazado: boolean
    redes: {salud: Institucion[],
            educacion: Institucion[],
            cultural: Institucion[], 
            otros: Institucion[]}
}


export type SolicitudCreate = {
    id_institucion?: number
    institucion?: InstitucionCreate
    solicitante: Solicitante
    adolescente: Adolescente
    id_motivo: number
    id_prioridad: number
    descripcion: string
    archivos: File[]
}
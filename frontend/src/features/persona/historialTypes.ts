export type FiltrosHistorial = { nombre: string; apellido: string; dni: string; legajo: string }

export type NinoHistorial = {
  id: number
  nombre: string
  apellido: string
  dni: string
  sexo: string
  fecha_nacimiento: string
  legajo: number | null
  validado: boolean
}

export type ResultadosHistorial = {
  count: number
  next: string | null
  previous: string | null
  results: NinoHistorial[]
}

export type ComentarioHistorial = {
  id: number
  comentario: string
  usuario_nombre: string
  fecha_hora_creacion: string
  fecha_hora_ultmod: string
}

export type SolicitudHistorial = {
  id: number
  motivo: string
  equipo: string
  validado: boolean
  rechazado: boolean
  descripcion: string
  descripcion_extra: string | null
  motivo_rechazo: string | null
  fecha_hora_creacion: string
  fecha_hora_entrada: string | null
  fecha_hora_admision: string | null
  comentarios: ComentarioHistorial[]
}

export type HistorialNino = { nino: NinoHistorial; solicitudes: SolicitudHistorial[] }
export type IntervencionHistorial = ComentarioHistorial & { solicitud: number; motivo: string; equipo: string }

import http from '@/common/api/client'
import type { MotivoSolicitud, PrioridadSolicitud, Solicitud } from './types'


export const getMotivos = (): Promise<MotivoSolicitud[]> => {
  return http.get<MotivoSolicitud[]>('solicitud/motivo/').then(res => res.data)
}

export const getPrioridades = (): Promise<PrioridadSolicitud[]> => {
  return http.get<PrioridadSolicitud[]>('solicitud/prioridad/').then(res => res.data)
}


export const getSolicitudes = (): Promise<Solicitud[]> => {
  return http.get<Solicitud[]>('solicitud/solicitud/').then(res => res.data)
}


export const getSolicitudById = (id: number): Promise<Solicitud> => {
  return http.get<Solicitud>(`solicitud/solicitud/${id}/`).then(res => res.data)
}

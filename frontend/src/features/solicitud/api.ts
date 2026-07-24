import http from '@/common/api/client'
import type { MotivoSolicitud, PrioridadSolicitud } from './types'


export const getMotivos = (): Promise<MotivoSolicitud[]> => {
  return http.get<MotivoSolicitud[]>('solicitud/motivo/').then(res => res.data)
}

export const getPrioridades = (): Promise<PrioridadSolicitud[]> => {
  return http.get<PrioridadSolicitud[]>('solicitud/prioridad/').then(res => res.data)
}
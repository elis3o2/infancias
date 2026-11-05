import http from '@/common/api/client'
import type { FiltrosHistorial, HistorialNino, ResultadosHistorial } from './historialTypes'

export const buscarNinos = (filtros: Partial<FiltrosHistorial>, page: number, signal?: AbortSignal): Promise<ResultadosHistorial> =>
  http.get<ResultadosHistorial>('persona/historial/', { params: { ...filtros, page }, signal }).then(({ data }) => data)

export const getHistorialNino = (id: number, signal?: AbortSignal): Promise<HistorialNino> =>
  http.get<HistorialNino>(`persona/historial/${id}/`, { signal }).then(({ data }) => data)

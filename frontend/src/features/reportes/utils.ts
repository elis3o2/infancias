import type { FiltrosReporte, PeriodoReporte, SolicitudReporte } from './types'

export function leerFiltrosReporte(params: URLSearchParams): FiltrosReporte {
  const periodo = params.get('periodo') ?? 'semana'
  if (!['semana', 'mes', 'todo', 'personalizado'].includes(periodo)) throw new Error('El período no es válido.')
  return { periodo: periodo as PeriodoReporte, desde: params.get('desde') ?? '', hasta: params.get('hasta') ?? '',
    equipo: params.get('equipo') ?? '', estado: params.get('estado') ?? '', solicitud: params.get('solicitud') ?? '' }
}

export function prepararFiltrosReporte(filtros: FiltrosReporte): URLSearchParams {
  const params = new URLSearchParams({ periodo: filtros.periodo })
  if (filtros.periodo === 'personalizado') {
    if (!filtros.desde || !filtros.hasta) throw new Error('Indicá las fechas desde y hasta.')
    if (filtros.desde > filtros.hasta) throw new Error('La fecha desde no puede ser posterior a hasta.')
    params.set('desde', filtros.desde); params.set('hasta', filtros.hasta)
  }
  for (const campo of ['equipo', 'solicitud'] as const) {
    const valor = filtros[campo].trim()
    if (campo === 'equipo' && valor === 'rechazadas') { params.set(campo, valor); continue }
    if (valor && (!/^[1-9][0-9]*$/.test(valor) || Number(valor) > 2147483647)) throw new Error('El número de solicitud o equipo no es válido.')
    if (valor) params.set(campo, valor)
  }
  if (filtros.estado) {
    if (!['pendiente', 'validada', 'rechazada'].includes(filtros.estado)) throw new Error('El estado no es válido.')
    params.set('estado', filtros.estado)
  }
  return params
}

export function estadoReporte(solicitud: Pick<SolicitudReporte, 'validado' | 'rechazado'>) {
  if (solicitud.rechazado) return { texto: 'Rechazada', color: 'error' as const }
  if (solicitud.validado) return { texto: 'Validada', color: 'success' as const }
  return { texto: 'Pendiente de validación', color: 'warning' as const }
}

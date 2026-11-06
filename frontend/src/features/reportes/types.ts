import type { LegajoSolicitud } from '@/features/solicitud/types'

export type PeriodoReporte = 'semana' | 'mes' | 'todo' | 'personalizado'
export type FiltrosReporte = {
  periodo: PeriodoReporte
  desde: string
  hasta: string
  equipo: string
  estado: string
  solicitud: string
}
export type EquipoReporte = { id: number | 'rechazadas'; nombre: string; total: number }
export type SolicitudReporte = {
  id: number
  equipo: string
  motivo: string
  fecha_hora_creacion: string
  validado: boolean
  rechazado: boolean
  cantidad_adolescentes: number
  cantidad_comentarios: number
  legajos: LegajoSolicitud[]
}
export type ReporteSolicitudes = {
  general: { total: number; pendientes: number; ingresadas_semana: number; semana_desde: string; semana_hasta: string; equipos: EquipoReporte[] }
  periodo: { desde: string | null; hasta: string | null }
  resumen: { total: number; pendientes: number; validadas: number; rechazadas: number; intervenciones: number;
    motivos: { motivo__nombre: string; total: number }[] }
  solicitudes: { pagina: number; count: number; next: string | null; previous: string | null; results: SolicitudReporte[] }
}

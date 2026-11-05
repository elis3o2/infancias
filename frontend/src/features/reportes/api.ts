import http from '@/common/api/client'
import type { ReporteSolicitudes } from './types'

export const getReporteSolicitudes = (params: URLSearchParams, signal?: AbortSignal): Promise<ReporteSolicitudes> =>
  http.get<ReporteSolicitudes>('solicitud/reportes/', { params, signal }).then(({ data }) => data)

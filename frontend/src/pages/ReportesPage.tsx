import { useEffect, useState } from 'react'
import { Alert, Button, CircularProgress, Container, Divider, Stack, Typography } from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import { formatFecha } from '@/common/utils'
import { getSolicitudErrorMessage } from '@/features/solicitud/utils'
import { getReporteSolicitudes } from '@/features/reportes/api'
import type { ReporteSolicitudes } from '@/features/reportes/types'
import { leerFiltrosReporte } from '@/features/reportes/utils'
import { EquiposReporte } from '@/features/reportes/EquiposReporte'
import { FiltrosReporteForm } from '@/features/reportes/FiltrosReporteForm'
import { IndicadoresReporte } from '@/features/reportes/IndicadoresReporte'
import { ListadoReporte } from '@/features/reportes/ListadoReporte'
import { ResumenReporte } from '@/features/reportes/ResumenReporte'

export default function ReportesPage() {
  const [params, setParams] = useSearchParams()
  const [revision, setRevision] = useState(0)
  const consulta = params.toString()
  return <Container maxWidth="xl" sx={{ py: 3 }}>
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Reportes de solicitudes</Typography>
        <Button onClick={() => setRevision((valor) => valor + 1)}>Actualizar</Button>
      </Stack>
      <Typography color="text.secondary">Ingresos, estados y ubicación actual. Consulta de todos los equipos, en modo de solo lectura.</Typography>
      <ContenidoReportes key={`${consulta}-${revision}`} consulta={consulta} onAplicar={(nuevos) => { setParams(nuevos); setRevision((valor) => valor + 1) }}
        onPagina={(pagina) => { const nuevos = new URLSearchParams(params); nuevos.set('page', String(pagina)); setParams(nuevos) }} />
    </Stack>
  </Container>
}

function ContenidoReportes({ consulta, onAplicar, onPagina }: {
  consulta: string; onAplicar: (params: URLSearchParams) => void; onPagina: (pagina: number) => void
}) {
  const [datos, setDatos] = useState<ReporteSolicitudes | null>(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    async function cargar() {
      setError(''); setDatos(null)
      try {
        leerFiltrosReporte(new URLSearchParams(consulta))
        const reporte = await getReporteSolicitudes(new URLSearchParams(consulta), controller.signal)
        if (!controller.signal.aborted) setDatos(reporte)
      } catch (error) {
        if (!controller.signal.aborted) setError(getSolicitudErrorMessage(error, 'No se pudo cargar el reporte.'))
      }
    }
    void cargar()
    return () => controller.abort()
  }, [consulta, intento])
  if (error) return <Alert severity="error" action={<Stack direction="row"><Button onClick={() => setIntento((valor) => valor + 1)}>Reintentar</Button>
    <Button onClick={() => onAplicar(new URLSearchParams())}>Restablecer</Button></Stack>}>{error}</Alert>
  if (!datos) return <Stack role="status" aria-label="Cargando reportes" sx={{ alignItems: 'center', py: 4 }}><CircularProgress /></Stack>
  const filtros = leerFiltrosReporte(new URLSearchParams(consulta))
  return <Stack spacing={3}>
    <Typography component="h2" variant="h6">Panorama general · No cambia con los filtros</Typography>
    <IndicadoresReporte indicadores={[
      { titulo: 'Ingresadas esta semana', valor: datos.general.ingresadas_semana,
        detalle: `Lunes a domingo · ${formatFecha(datos.general.semana_desde)} al ${formatFecha(datos.general.semana_hasta)}` },
      { titulo: 'Total registrado', valor: datos.general.total, detalle: 'Todas las fechas y estados' },
      { titulo: 'Pendientes de validación', valor: datos.general.pendientes, detalle: 'De todas las fechas' },
    ]} />
    <EquiposReporte equipos={datos.general.equipos} />
    <Divider />
    <FiltrosReporteForm inicial={filtros} equipos={datos.general.equipos} onAplicar={onAplicar} />
    <Typography component="h2" variant="h6">Resultado filtrado · {datos.periodo.desde
      ? `${formatFecha(datos.periodo.desde)} al ${formatFecha(datos.periodo.hasta)}` : 'Todas las fechas'}</Typography>
    <ResumenReporte resumen={datos.resumen} />
    <ListadoReporte solicitudes={datos.solicitudes} pagina={datos.solicitudes.pagina} onPagina={onPagina} />
  </Stack>
}

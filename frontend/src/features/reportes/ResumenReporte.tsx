import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import type { ReporteSolicitudes } from './types'
import { IndicadoresReporte } from './IndicadoresReporte'

export function ResumenReporte({ resumen }: { resumen: ReporteSolicitudes['resumen'] }) {
  return <Stack spacing={2}>
    <IndicadoresReporte indicadores={[
      { titulo: 'Solicitudes encontradas', valor: resumen.total },
      { titulo: 'Pendientes de validación', valor: resumen.pendientes },
      { titulo: 'Validadas', valor: resumen.validadas },
      { titulo: 'Rechazadas', valor: resumen.rechazadas },
      { titulo: 'Intervenciones', valor: resumen.intervenciones, detalle: 'Todos los comentarios de estas solicitudes' },
    ]} />
    {resumen.motivos.length > 0 && <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Typography component="h3" variant="subtitle1" sx={{ mb: 1 }}>Solicitudes por motivo</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {resumen.motivos.map((motivo) => <Chip key={motivo.motivo__nombre} variant="outlined" label={`${motivo.motivo__nombre}: ${motivo.total}`} />)}
      </Box>
    </Paper>}
  </Stack>
}

import { Alert, Chip, Paper, Stack, Typography } from '@mui/material'
import type { IntervencionHistorial } from '../historialTypes'
import { fechaHistorial } from '../historialUtils'

export function IntervencionesHistorial({ intervenciones }: { intervenciones: IntervencionHistorial[] }) {
  if (!intervenciones.length) return <Alert severity="info">Todavía no hay intervenciones: las solicitudes no tienen comentarios.</Alert>
  return <Stack spacing={2}>
    {intervenciones.map((intervencion) => (
      <Paper component="article" key={intervencion.id} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{intervencion.usuario_nombre}</Typography>
            <Chip size="small" variant="outlined" label={`Solicitud #${intervencion.solicitud}`} />
          </Stack>
          <Typography variant="body2" color="text.secondary">{intervencion.motivo} · Equipo actual de la solicitud: {intervencion.equipo}</Typography>
          <Typography variant="caption">Creado: {fechaHistorial(intervencion.fecha_hora_creacion)}</Typography>
          {intervencion.fecha_hora_ultmod !== intervencion.fecha_hora_creacion && <Typography variant="caption" color="text.secondary">Editado: {fechaHistorial(intervencion.fecha_hora_ultmod)}</Typography>}
          <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{intervencion.comentario}</Typography>
        </Stack>
      </Paper>
    ))}
  </Stack>
}

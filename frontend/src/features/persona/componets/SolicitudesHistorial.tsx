import { Alert, Chip, Paper, Stack, Typography } from '@mui/material'
import type { SolicitudHistorial } from '../historialTypes'
import { estadoSolicitudHistorial, fechaHistorial } from '../historialUtils'

export function SolicitudesHistorial({ solicitudes }: { solicitudes: SolicitudHistorial[] }) {
  if (!solicitudes.length) return <Alert severity="info">No hay solicitudes registradas.</Alert>
  return <Stack spacing={2}>
    {solicitudes.map((solicitud) => {
      const estado = estadoSolicitudHistorial(solicitud)
      return <Paper component="article" key={solicitud.id} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="h6">Solicitud #{solicitud.id} · {solicitud.motivo}</Typography>
            <Chip label={estado.texto} color={estado.color} size="small" />
          </Stack>
          <Typography variant="body2" color="text.secondary">Equipo actual: {solicitud.equipo} · Creada: {fechaHistorial(solicitud.fecha_hora_creacion)}</Typography>
          {solicitud.fecha_hora_entrada && <Typography variant="body2">Procesada en entrada: {fechaHistorial(solicitud.fecha_hora_entrada)}</Typography>}
          {solicitud.fecha_hora_admision && <Typography variant="body2">Derivada desde admisión: {fechaHistorial(solicitud.fecha_hora_admision)}</Typography>}
          <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{solicitud.descripcion || 'Sin descripción.'}</Typography>
          {solicitud.descripcion_extra && <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>Información agregada: {solicitud.descripcion_extra}</Typography>}
          {solicitud.rechazado && solicitud.motivo_rechazo && <Alert severity="error" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>Motivo del rechazo: {solicitud.motivo_rechazo}</Alert>}
          <Typography variant="caption" color="text.secondary">{solicitud.comentarios.length} intervención{solicitud.comentarios.length === 1 ? '' : 'es'} registrada{solicitud.comentarios.length === 1 ? '' : 's'}</Typography>
        </Stack>
      </Paper>
    })}
  </Stack>
}

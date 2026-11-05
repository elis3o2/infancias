import { useState } from 'react'
import { Alert, Box, Chip, Paper, Stack, Tab, Tabs, Typography } from '@mui/material'
import { formatFecha } from '@/common/utils'
import type { HistorialNino } from '../historialTypes'
import { intervencionesDelHistorial } from '../historialUtils'
import { SolicitudesHistorial } from './SolicitudesHistorial'
import { IntervencionesHistorial } from './IntervencionesHistorial'

export function HistorialNinoDetalle({ historial }: { historial: HistorialNino }) {
  const [seccion, setSeccion] = useState(0)
  const { nino, solicitudes } = historial
  const intervenciones = intervencionesDelHistorial(solicitudes)
  return <Stack spacing={3}>
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
      <Stack spacing={1.5}>
        <Typography variant="h5" component="h1" sx={{ overflowWrap: 'anywhere' }}>{nino.nombre} {nino.apellido}</Typography>
        <Typography>DNI {nino.dni} · Sexo {nino.sexo}</Typography>
        <Typography variant="body2">Fecha de nacimiento: {formatFecha(nino.fecha_nacimiento)} · Legajo: {nino.legajo ?? 'Sin asignar'}</Typography>
        <Chip label={nino.validado ? 'Identidad validada' : 'Datos declarados · Sin validar'} size="small"
          color={nino.validado ? 'success' : 'default'} sx={{ alignSelf: 'flex-start' }} />
      </Stack>
    </Paper>
    <Alert severity="info">Historial de todos los equipos · Solo lectura. Las intervenciones corresponden a los comentarios de las solicitudes.</Alert>
    <Tabs value={seccion} onChange={(_, valor: number) => setSeccion(valor)} variant="scrollable" allowScrollButtonsMobile aria-label="Secciones del historial">
      <Tab id="historial-solicitudes-tab" aria-controls="historial-solicitudes-panel" label={`Solicitudes (${solicitudes.length})`} />
      <Tab id="historial-intervenciones-tab" aria-controls="historial-intervenciones-panel" label={`Intervenciones (${intervenciones.length})`} />
    </Tabs>
    <Box role="tabpanel" hidden={seccion !== 0} id="historial-solicitudes-panel" aria-labelledby="historial-solicitudes-tab">
      {seccion === 0 && <SolicitudesHistorial solicitudes={solicitudes} />}
    </Box>
    <Box role="tabpanel" hidden={seccion !== 1} id="historial-intervenciones-panel" aria-labelledby="historial-intervenciones-tab">
      {seccion === 1 && <IntervencionesHistorial intervenciones={intervenciones} />}
    </Box>
  </Stack>
}

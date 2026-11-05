import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import type { EquipoReporte } from './types'

export function EquiposReporte({ equipos }: { equipos: EquipoReporte[] }) {
  const maximo = Math.max(1, ...equipos.map((equipo) => equipo.total))
  return <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">Distribución actual por equipo</Typography>
      <Typography variant="body2" color="text.secondary">Todas las fechas. Las rechazadas forman un grupo separado y no suman en su equipo anterior. Elegí un equipo o grupo para ver su listado completo.</Typography>
      {!equipos.length && <Alert severity="info">No hay equipos registrados.</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {equipos.map((equipo) => <Box key={equipo.id} sx={{ minWidth: 0 }}>
          <Button component={Link} to={`/reportes?periodo=todo&equipo=${equipo.id}`} fullWidth
            aria-label={`Ver ${equipo.total} solicitudes de ${equipo.nombre}`} sx={{ justifyContent: 'space-between', textTransform: 'none', gap: 2 }}>
            <Typography component="span" sx={{ overflowWrap: 'anywhere', textAlign: 'left' }}>{equipo.nombre}</Typography>
            <Typography component="span" sx={{ fontWeight: 700 }}>{equipo.total}</Typography>
          </Button>
          <Box aria-hidden="true" sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${equipo.total / maximo * 100}%`, bgcolor: 'primary.main' }} />
          </Box>
        </Box>)}
      </Box>
    </Stack>
  </Paper>
}

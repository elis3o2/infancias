import { Alert, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import type { ResultadosHistorial as Resultados } from '../historialTypes'

type Props = { datos: Resultados; pagina: number; consulta: string; onPagina: (pagina: number) => void }

export function ResultadosHistorial({ datos, pagina, consulta, onPagina }: Props) {
  if (!datos.count) return <Alert severity="info">No se encontraron niños con esos datos. Probá con otro criterio.</Alert>
  return (
    <Stack spacing={2}>
      <Typography role="status">{datos.count} resultado{datos.count === 1 ? '' : 's'}</Typography>
      {datos.results.map((nino) => (
        <Paper key={nino.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
            <Stack spacing={0.75} sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ overflowWrap: 'anywhere' }}>{nino.nombre} {nino.apellido}</Typography>
              <Typography variant="body2">DNI {nino.dni} · Sexo {nino.sexo} · Legajo {nino.legajo ?? 'Sin asignar'} · Carpeta {nino.carpeta ?? 'Sin asignar'}</Typography>
              {!nino.validado && <Chip label="Datos declarados · Sin validar" size="small" sx={{ alignSelf: 'flex-start' }} />}
            </Stack>
            <Button component={Link} to={`/historial/${nino.id}?${consulta}`} variant="outlined"
              aria-label={`Ver historial de ${nino.nombre} ${nino.apellido}`}>Ver historial</Button>
          </Stack>
        </Paper>
      ))}
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <Button disabled={!datos.previous} onClick={() => onPagina(pagina - 1)}>Anterior</Button>
        <Typography variant="body2">Página {pagina}</Typography>
        <Button disabled={!datos.next} onClick={() => onPagina(pagina + 1)}>Siguiente</Button>
      </Stack>
    </Stack>
  )
}

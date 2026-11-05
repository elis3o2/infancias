import { Alert, Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { formatFecha } from '@/common/utils'
import type { ReporteSolicitudes } from './types'
import { estadoReporte } from './utils'

type Props = { solicitudes: ReporteSolicitudes['solicitudes']; pagina: number; onPagina: (pagina: number) => void }

export function ListadoReporte({ solicitudes, pagina, onPagina }: Props) {
  if (!solicitudes.count) return <Alert severity="info">No hay solicitudes que coincidan con los filtros.</Alert>
  return <Stack spacing={2}>
    <Typography variant="h6" component="h3">Ubicación de cada solicitud</Typography>
    <Typography role="status" variant="body2">{solicitudes.count} solicitudes · Página {pagina} de {Math.ceil(solicitudes.count / 20)}</Typography>
    <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' }, borderRadius: 3 }}>
      <Table size="small" aria-label="Ubicación actual de las solicitudes">
        <TableHead><TableRow>{['Solicitud', 'Creada', 'Equipo / grupo', 'Estado', 'Motivo', 'Adolescentes', 'Intervenciones'].map((titulo) => <TableCell key={titulo}>{titulo}</TableCell>)}</TableRow></TableHead>
        <TableBody>{solicitudes.results.map((solicitud) => {
          const estado = estadoReporte(solicitud)
          return <TableRow key={solicitud.id}>
            <TableCell component="th" scope="row">#{solicitud.id}</TableCell><TableCell>{formatFecha(solicitud.fecha_hora_creacion)}</TableCell>
            <TableCell>{solicitud.equipo}</TableCell><TableCell><Chip size="small" label={estado.texto} color={estado.color} /></TableCell>
            <TableCell>{solicitud.motivo}</TableCell><TableCell>{solicitud.cantidad_adolescentes}</TableCell><TableCell>{solicitud.cantidad_comentarios}</TableCell>
          </TableRow>
        })}</TableBody>
      </Table>
    </TableContainer>
    <Box sx={{ display: { xs: 'grid', md: 'none' }, gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
      {solicitudes.results.map((solicitud) => {
        const estado = estadoReporte(solicitud)
        return <Paper component="article" key={solicitud.id} variant="outlined" sx={{ p: 2, borderRadius: 3, overflowWrap: 'anywhere' }}>
          <Stack spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Solicitud #{solicitud.id}</Typography>
            <Typography>Equipo / grupo: {solicitud.equipo}</Typography>
            <Chip size="small" label={estado.texto} color={estado.color} sx={{ alignSelf: 'flex-start' }} />
            <Typography variant="body2">Creada: {formatFecha(solicitud.fecha_hora_creacion)} · {solicitud.motivo}</Typography>
            <Typography variant="body2">Adolescentes: {solicitud.cantidad_adolescentes} · Intervenciones: {solicitud.cantidad_comentarios}</Typography>
          </Stack>
        </Paper>
      })}
    </Box>
    <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
      <Button disabled={!solicitudes.previous} onClick={() => onPagina(pagina - 1)}>Anterior</Button>
      <Button disabled={!solicitudes.next} onClick={() => onPagina(pagina + 1)}>Siguiente</Button>
    </Stack>
  </Stack>
}

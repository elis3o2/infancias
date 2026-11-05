import { useState } from 'react'
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import type { EquipoReporte, FiltrosReporte, PeriodoReporte } from './types'
import { prepararFiltrosReporte } from './utils'

type Props = { inicial: FiltrosReporte; equipos: EquipoReporte[]; onAplicar: (params: URLSearchParams) => void }

export function FiltrosReporteForm({ inicial, equipos, onAplicar }: Props) {
  const [filtros, setFiltros] = useState(inicial)
  const [error, setError] = useState('')
  return <Paper component="form" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }} onSubmit={(event) => {
    event.preventDefault()
    try { onAplicar(prepararFiltrosReporte(filtros)); setError('') }
    catch (error) { setError(error instanceof Error ? error.message : 'Revisá los filtros.') }
  }}>
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">Consultar solicitudes</Typography>
      <Typography variant="body2" color="text.secondary">Las fechas filtran por creación. Para localizar una solicitud antigua, elegí “Todas las fechas”.</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
        <TextField select label="Período" value={filtros.periodo} onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value as PeriodoReporte })}>
          <MenuItem value="semana">Esta semana</MenuItem><MenuItem value="mes">Este mes</MenuItem>
          <MenuItem value="todo">Todas las fechas</MenuItem><MenuItem value="personalizado">Personalizado</MenuItem>
        </TextField>
        <TextField select label="Equipo / grupo" value={filtros.equipo} onChange={(e) => setFiltros({ ...filtros, equipo: e.target.value })}>
          <MenuItem value="">Todos los equipos y grupos</MenuItem>
          {equipos.map((equipo) => <MenuItem key={equipo.id} value={String(equipo.id)}>{equipo.nombre}</MenuItem>)}
        </TextField>
        <TextField select label="Estado" value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
          <MenuItem value="">Todos los estados</MenuItem><MenuItem value="pendiente">Pendiente de validación</MenuItem>
          <MenuItem value="validada">Validada</MenuItem><MenuItem value="rechazada">Rechazada</MenuItem>
        </TextField>
        <TextField label="Número de solicitud" value={filtros.solicitud} onChange={(e) => setFiltros({ ...filtros, solicitud: e.target.value })}
          slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }} />
        {filtros.periodo === 'personalizado' && (['desde', 'hasta'] as const).map((campo) => <TextField key={campo} type="date" required
          label={campo === 'desde' ? 'Desde' : 'Hasta'} value={filtros[campo]} onChange={(e) => setFiltros({ ...filtros, [campo]: e.target.value })}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: '9998-12-31' } }} />)}
      </Box>
      {error && <Alert severity="warning">{error}</Alert>}
      <Stack direction="row" spacing={1}>
        <Button variant="contained" type="submit">Aplicar filtros</Button>
        <Button onClick={() => onAplicar(new URLSearchParams())}>Restablecer</Button>
      </Stack>
    </Stack>
  </Paper>
}

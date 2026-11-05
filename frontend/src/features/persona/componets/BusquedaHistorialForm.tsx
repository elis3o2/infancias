import { useState } from 'react'
import { Alert, Box, Button, Paper, Stack, TextField } from '@mui/material'
import type { FiltrosHistorial } from '../historialTypes'
import { prepararBusquedaHistorial } from '../historialUtils'

type Props = {
  inicial: FiltrosHistorial
  onBuscar: (filtros: Partial<FiltrosHistorial>) => void
  onLimpiar: () => void
}

export function BusquedaHistorialForm({ inicial, onBuscar, onLimpiar }: Props) {
  const [filtros, setFiltros] = useState(inicial)
  const [error, setError] = useState('')
  return (
    <Paper component="form" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}
      onSubmit={(event) => {
        event.preventDefault()
        try { onBuscar(prepararBusquedaHistorial(filtros)); setError('') }
        catch (error) { setError(error instanceof Error ? error.message : 'Revisá los criterios de búsqueda.') }
      }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          {(['nombre', 'apellido', 'dni', 'legajo'] as const).map((campo) => (
            <TextField key={campo} fullWidth label={{ nombre: 'Nombre', apellido: 'Apellido', dni: 'Documento (DNI)', legajo: 'Número de legajo' }[campo]}
              value={filtros[campo]} onChange={(event) => { setFiltros({ ...filtros, [campo]: event.target.value }); setError('') }}
              slotProps={{ htmlInput: { maxLength: campo === 'dni' ? 9 : campo === 'legajo' ? 10 : 64,
                inputMode: campo === 'dni' || campo === 'legajo' ? 'numeric' : 'text' } }} />
          ))}
        </Box>
        {error && <Alert severity="warning">{error}</Alert>}
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained">Buscar</Button>
          <Button type="button" onClick={() => {
            setFiltros({ nombre: '', apellido: '', dni: '', legajo: '' }); setError(''); onLimpiar()
          }}>Limpiar</Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

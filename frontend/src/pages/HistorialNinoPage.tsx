import { useEffect, useState } from 'react'
import { Alert, Button, CircularProgress, Container, Stack } from '@mui/material'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getHistorialNino } from '@/features/persona/historialApi'
import type { HistorialNino } from '@/features/persona/historialTypes'
import { HistorialNinoDetalle } from '@/features/persona/componets/HistorialNinoDetalle'
import { getSolicitudErrorMessage } from '@/features/solicitud/utils'

export default function HistorialNinoPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  return <Container maxWidth="lg" sx={{ py: 3 }}>
    <Stack spacing={3}>
      <Button component={Link} to={`/historial?${params.toString()}`} sx={{ alignSelf: 'flex-start' }}>Volver a la búsqueda</Button>
      {id && /^[1-9][0-9]*$/.test(id) && Number.isSafeInteger(Number(id))
        ? <ConsultaNino key={id} id={Number(id)} /> : <Alert severity="error">El niño indicado no es válido.</Alert>}
    </Stack>
  </Container>
}

function ConsultaNino({ id }: { id: number }) {
  const [historial, setHistorial] = useState<HistorialNino | null>(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    async function cargar() {
      setError(''); setHistorial(null)
      try {
        const datos = await getHistorialNino(id, controller.signal)
        if (!controller.signal.aborted) setHistorial(datos)
      } catch (error) {
        if (!controller.signal.aborted) setError(getSolicitudErrorMessage(error, 'No se pudo cargar el historial.'))
      }
    }
    void cargar()
    return () => controller.abort()
  }, [id, intento])
  if (error) return <Alert severity="error" action={<Button onClick={() => setIntento((actual) => actual + 1)}>Reintentar</Button>}>{error}</Alert>
  if (!historial) return <Stack role="status" aria-label="Cargando historial" sx={{ alignItems: 'center', py: 4 }}><CircularProgress /></Stack>
  return <HistorialNinoDetalle historial={historial} />
}

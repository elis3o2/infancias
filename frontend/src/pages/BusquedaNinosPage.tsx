import { useEffect, useState } from 'react'
import { Alert, Button, CircularProgress, Container, Stack, Typography } from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import { buscarNinos } from '@/features/persona/historialApi'
import { leerFiltrosHistorial, prepararBusquedaHistorial } from '@/features/persona/historialUtils'
import type { ResultadosHistorial as Resultados } from '@/features/persona/historialTypes'
import { BusquedaHistorialForm } from '@/features/persona/componets/BusquedaHistorialForm'
import { ResultadosHistorial } from '@/features/persona/componets/ResultadosHistorial'
import { getSolicitudErrorMessage } from '@/features/solicitud/utils'

export default function BusquedaNinosPage() {
  const [params, setParams] = useSearchParams()
  const consulta = params.toString()
  const [intento, setIntento] = useState(0)
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" component="h1">Historial de niñas, niños y adolescentes</Typography>
        <Typography color="text.secondary">Buscá por nombre y apellido, documento o legajo. Si completás varios campos, se combinarán los criterios.</Typography>
        <BusquedaHistorialForm key={consulta} inicial={leerFiltrosHistorial(params)} onLimpiar={() => setParams({})}
          onBuscar={(filtros) => { setParams(filtros); setIntento((actual) => actual + 1) }} />
        {consulta ? <ConsultaHistorial key={`${consulta}-${intento}`} consulta={consulta}
          onPagina={(pagina) => { const siguientes = new URLSearchParams(params); siguientes.set('page', String(pagina)); setParams(siguientes) }} />
          : <Alert severity="info">Ingresá algún dato para buscar. El historial incluye solicitudes de todos los equipos y sus comentarios.</Alert>}
      </Stack>
    </Container>
  )
}

function ConsultaHistorial({ consulta, onPagina }: { consulta: string; onPagina: (pagina: number) => void }) {
  const [datos, setDatos] = useState<Resultados | null>(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const pagina = Number(new URLSearchParams(consulta).get('page') ?? 1)
  useEffect(() => {
    const controller = new AbortController()
    async function cargar() {
      setError(''); setDatos(null)
      try {
        if (!Number.isSafeInteger(pagina) || pagina < 1) throw new Error('La página solicitada no es válida.')
        const filtros = prepararBusquedaHistorial(leerFiltrosHistorial(new URLSearchParams(consulta)))
        const resultado = await buscarNinos(filtros, pagina, controller.signal)
        if (!controller.signal.aborted) setDatos(resultado)
      } catch (error) {
        if (!controller.signal.aborted) setError(getSolicitudErrorMessage(error, 'No se pudo realizar la búsqueda.'))
      }
    }
    void cargar()
    return () => controller.abort()
  }, [consulta, pagina, intento])
  if (error) return <Alert severity="error" action={<Button onClick={() => setIntento((actual) => actual + 1)}>Reintentar</Button>}>{error}</Alert>
  if (!datos) return <Stack role="status" aria-label="Buscando niños" sx={{ alignItems: 'center', py: 4 }}><CircularProgress /></Stack>
  return <ResultadosHistorial datos={datos} pagina={pagina} consulta={consulta} onPagina={onPagina} />
}

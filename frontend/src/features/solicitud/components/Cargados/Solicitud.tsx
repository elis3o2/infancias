import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { getSolicitudById } from "../../api"
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material"
import CheckCircleOutlinedIcon  from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlinedIcon       from "@mui/icons-material/CancelOutlined"
import type { Solicitud } from "../../types";
import { SolicitudValidar } from "./SolicitudValidar";
import { SolicitudValidada } from "./SolicitudValidada";


// ── Helpers ──────────────────────────────────────────────────────────────────

const PRIORIDAD_COLOR = { 1: "error", 2: "warning", 3: "success" }

function formatFecha(str) {
  if (!str) return "—"

  try {
    const fecha = new Date(str)

    if (isNaN(fecha.getTime())) return str

    const dia = String(fecha.getUTCDate()).padStart(2, "0")
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0")
    const anio = fecha.getUTCFullYear()

    return `${dia}-${mes}-${anio}`
  } catch {
    return str
  }
}

// ── Componente principal ──────────────────────────────────────────────────────

export const ValidarSolicitud = () => {
  const { id } = useParams()
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  
  useEffect(() => {
    if (!id) return
    setLoading(true)
    getSolicitudById(Number(id))
      .then(setSolicitud)
      .catch(e => setError(e.message ?? "Error al cargar la solicitud"))
      .finally(() => setLoading(false))
  }, [id])



  // ── Estados de carga / error ───────────────────────────────────────────────
  if (loading)
    return (
      <Stack alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress />
      </Stack>
    )

  if (error)
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )

  if (!solicitud)
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">Solicitud no encontrada.</Alert>
      </Container>
    )

  const prioridadColor = PRIORIDAD_COLOR[solicitud.prioridad?.id] ?? "default"
  // ── Vista ──────────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>

        {/* ── Encabezado ── */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
            <Typography variant="h5" fontWeight={500}>
              {solicitud.motivo?.nombre ?? "Solicitud"}
            </Typography>
            <Chip
              label={solicitud.prioridad?.nombre ?? "—"}
              color={prioridadColor}
              size="small"
              variant="outlined"
            />
          </Stack>
          <Stack direction="row" spacing={3} mt={0.5} flexWrap="wrap">
            <Typography variant="caption" color="text.secondary">
              Creada: {formatFecha(solicitud.fecha_hora_creacion)}
            </Typography>
            {solicitud.fecha_hora_modificacion && solicitud.validado && (
              <Typography variant="caption" color="text.secondary">
                Validada: {formatFecha(solicitud.fecha_hora_modificacion)}
              </Typography>
            )}
            {solicitud.fecha_hora_modificacion && solicitud.rechazado && (
              <Typography variant="caption" color="text.secondary">
                Rechazada: {formatFecha(solicitud.fecha_hora_modificacion)}
              </Typography>
            )}
          </Stack>
        </Box>

        {/* ── Estado ── */}
        {solicitud.validado && (
          <Alert severity="success" icon={<CheckCircleOutlinedIcon />}>
            <Typography>Esta solicitud fue validada.</Typography>
            {solicitud.derivacion && (
              <Typography variant="body2">
                <strong>Derivación:</strong> {solicitud.derivacion.nombre}
              </Typography>
            )}
      </Alert>
        )}


        {solicitud.rechazado && (
        <Alert severity="error" icon={<CancelOutlinedIcon />}>
          <Typography>Esta solicitud fue rechazada.</Typography>
          {solicitud.motivo_rechazo && (
            <Typography variant="body2">
              <strong>Motivo:</strong> {solicitud.motivo_rechazo}
            </Typography>
          )}
        </Alert>
        )}
        {!solicitud.validado && !solicitud.rechazado && (
          <Alert severity="warning">Solicitud pendiente de validación.</Alert>
        )}
        {!solicitud.validado && !solicitud.rechazado && (
          <SolicitudValidar solicitud={solicitud} />
        )}
        { (solicitud.validado || solicitud.rechazado) && 
        <SolicitudValidada solicitud={solicitud}/>}

      </Stack>   
    </Container>
  )
}
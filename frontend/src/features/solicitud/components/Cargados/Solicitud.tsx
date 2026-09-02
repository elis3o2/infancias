import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"

import { getSolicitudById } from "../../api"
import { Alert, Box, Chip, CircularProgress, Container, Stack, Typography } from "@mui/material"
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined"
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined"
import type { Solicitud, SolicitudCrud, SolicitudRechazada } from "../../types"

import { SolicitudValidar } from "./SolicitudValidar"
import { SolicitudValidada } from "./SolicitudValidada"
import { SolicitudRechazadaComponent } from "./SolicitudRechazadaComponent"

const PRIORIDAD_COLOR: Record<number, "error" | "warning" | "success"> = {
  1: "error",
  2: "warning",
  3: "success",
}

function formatFecha(str: string | null | undefined): string {
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

export const ValidarSolicitud = () => {
  const { id } = useParams()
  const [solicitud, setSolicitud] = useState<Solicitud | SolicitudCrud | SolicitudRechazada | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    getSolicitudById(Number(id))
      .then(setSolicitud)
      .catch((e) => setError(e?.message ?? "Error al cargar la solicitud"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <Stack sx={{ alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Stack>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!solicitud) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">Solicitud no encontrada.</Alert>
      </Container>
    )
  }

  const prioridadColor = PRIORIDAD_COLOR[solicitud.prioridad?.id] ?? "success"

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Stack
            direction="row"
            sx={{ alignItems: "center", flexWrap: "wrap" }}
            spacing={2}
          >
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              {solicitud.motivo?.nombre ?? "Solicitud"}
            </Typography>

            <Chip
              label={solicitud.prioridad?.nombre ?? "—"}
              color={prioridadColor}
              size="small"
              variant="outlined"
            />
          </Stack>

          <Stack
            direction="row"
            sx={{ flexWrap: "wrap", mt: 0.5 }}
            spacing={3}
          >
            <Typography variant="caption" color="text.secondary">
              Creada: {formatFecha(solicitud.fecha_hora_creacion)}
            </Typography>

            {solicitud.fecha_hora_entrada && (
              <Typography variant="caption" color="text.secondary">
                Entrada: {formatFecha(solicitud.fecha_hora_entrada)}
              </Typography>
            )}

            {solicitud.fecha_hora_admision && (
              <Typography variant="caption" color="text.secondary">
                Admisión: {formatFecha(solicitud.fecha_hora_admision)}
              </Typography>
            )}
          </Stack>
        </Box>

        {solicitud.validado && (
          <Alert severity="success" icon={<CheckCircleOutlinedIcon />}>
            <Typography>Esta solicitud fue validada.</Typography>
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
          <>
            <Alert severity="warning">Solicitud pendiente de validación.</Alert>
            <SolicitudValidar solicitud={solicitud} />
          </>
        )}

        {solicitud.validado && <SolicitudValidada solicitud={solicitud} />}
        {solicitud.rechazado && <SolicitudRechazadaComponent solicitud={solicitud} />}
      </Stack>
    </Container>
  )
}
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"

import { getSolicitudById } from "../../api"
import { Alert, Box, Chip, CircularProgress, Container, Paper, Stack, Typography } from "@mui/material"
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined"
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined"
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded"
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded"
import type { SolicitudDetalle } from "../../types"

import { SolicitudValidar } from "./SolicitudValidar"
import { SolicitudValidada } from "./SolicitudValidada"
import { SolicitudRechazadaComponent } from "./SolicitudRechazadaComponent"
import { ComentariosSolicitud } from "./ComentariosSolicitud"
import { formatFecha } from "@/common/utils"
import { getSolicitudErrorMessage } from "../../utils"

export const ValidarSolicitud = () => {
  const { id } = useParams()

  if (!id || !Number.isInteger(Number(id))) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">La solicitud indicada no es válida.</Alert>
      </Container>
    )
  }

  return <SolicitudDetalleVista key={id} id={Number(id)} />
}

const SolicitudDetalleVista = ({ id }: { id: number }) => {
  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activa = true

    const cargarSolicitud = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getSolicitudById(id)
        if (activa) setSolicitud(data)
      } catch (error) {
        if (activa) {
          setError(getSolicitudErrorMessage(error, "No se pudo cargar la solicitud."))
        }
      } finally {
        if (activa) setLoading(false)
      }
    }

    void cargarSolicitud()
    return () => {
      activa = false
    }
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

  const estado = solicitud.validado
    ? { texto: "Validada", color: "success" as const }
    : solicitud.rechazado
      ? { texto: "Rechazada", color: "error" as const }
      : { texto: "Pendiente de validación", color: "warning" as const }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      <Stack spacing={{ xs: 2, sm: 3 }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 4,
            borderColor: "primary.light",
            background: "linear-gradient(135deg, #f8fbff 0%, #eef6ff 100%)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between" }}
            spacing={1.5}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                }}
              >
                <AssignmentRoundedIcon />
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                  Solicitud #{solicitud.id}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {solicitud.motivo?.nombre ?? "Solicitud"}
                </Typography>
              </Box>
            </Stack>

            <Chip label={estado.texto} color={estado.color} sx={{ fontWeight: 700 }} />
          </Stack>

          <Stack
            direction="row"
            sx={{ flexWrap: "wrap", mt: 2, alignItems: "center" }}
            spacing={{ xs: 1.5, sm: 3 }}
          >
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <AccessTimeRoundedIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Creada: {formatFecha(solicitud.fecha_hora_creacion)}
              </Typography>
            </Stack>

            {solicitud.fecha_hora_entrada && (
              <Typography variant="body2" color="text.secondary">
                Entrada: {formatFecha(solicitud.fecha_hora_entrada)}
              </Typography>
            )}

            {solicitud.fecha_hora_admision && (
              <Typography variant="body2" color="text.secondary">
                Admisión: {formatFecha(solicitud.fecha_hora_admision)}
              </Typography>
            )}
          </Stack>
        </Paper>

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
            <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2.5 }}>
              Revisá los datos recibidos y luego buscá coincidencias antes de tomar una decisión.
            </Alert>
            <SolicitudValidar key={solicitud.id} solicitud={solicitud} />
          </>
        )}

        {solicitud.validado && <SolicitudValidada solicitud={solicitud} onActualizar={setSolicitud} />}
        {solicitud.rechazado && <SolicitudRechazadaComponent solicitud={solicitud} />}
        <ComentariosSolicitud key={solicitud.id} solicitudId={solicitud.id}
          iniciales={solicitud.comentarios ?? []} puedeComentar={Boolean(solicitud.puede_comentar)} />
      </Stack>
    </Container>
  )
}

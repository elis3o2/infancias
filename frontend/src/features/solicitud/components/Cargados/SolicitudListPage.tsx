import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material"
import { getSolicitudSimple } from "@/features/solicitud/api"
import type { SolicitudSimple } from "@/features/solicitud/types"
import { formatFechaHora } from "@/common/utils"
import { LegajosSolicitud } from "./LegajosSolicitud"

type EstadoSolicitud = {
  label: string
  accent: string
  background: string
  text: string
}

function getEstado(solicitud: SolicitudSimple): EstadoSolicitud {
  if (solicitud.rechazado) {
    return { label: "Rechazada", accent: "#DC2626", background: "#FEE2E2", text: "#991B1B" }
  }
  if (solicitud.validado) {
    return { label: "Validada", accent: "#16A34A", background: "#DCFCE7", text: "#166534" }
  }
  return { label: "Pendiente", accent: "#D97706", background: "#FEF3C7", text: "#92400E" }
}

function getFechaRelevante(solicitud: SolicitudSimple): string {
  if ((solicitud.validado || solicitud.rechazado) && solicitud.fecha_hora_modificacion) {
    return solicitud.fecha_hora_modificacion
  }
  return solicitud.fecha_hora_creacion
}

function formatRelativo(fecha: string): string {
  const timestamp = new Date(fecha).getTime()
  if (Number.isNaN(timestamp)) return "—"

  const diferenciaMinutos = Math.max(0, Math.round((Date.now() - timestamp) / 60_000))
  if (diferenciaMinutos < 1) return "recién"
  if (diferenciaMinutos < 60) return `${diferenciaMinutos} min`

  const diferenciaHoras = Math.round(diferenciaMinutos / 60)
  if (diferenciaHoras < 24) return `${diferenciaHoras} h`

  const diferenciaDias = Math.round(diferenciaHoras / 24)
  if (diferenciaDias === 1) return "ayer"
  if (diferenciaDias < 30) return `${diferenciaDias} días`

  const diferenciaMeses = Math.round(diferenciaDias / 30)
  return `${diferenciaMeses} ${diferenciaMeses === 1 ? "mes" : "meses"}`
}

export const SolicitudListPage = () => {
  const navigate = useNavigate()
  const [solicitudes, setSolicitudes] = useState<SolicitudSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activa = true

    const cargarSolicitudes = async () => {
      setLoading(true)
      setError(false)

      try {
        const data = await getSolicitudSimple()
        if (activa) setSolicitudes(data)
      } catch {
        if (activa) setError(true)
      } finally {
        if (activa) setLoading(false)
      }
    }

    void cargarSolicitudes()
    return () => {
      activa = false
    }
  }, [intento])

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} thickness={4} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 600, color: "#B91C1C" }}>
          No se pudieron cargar las solicitudes.
        </Typography>
        <Typography variant="body2" sx={{ color: "#94A3B8", mt: 0.5, mb: 2 }}>
          Revisá tu conexión e intentá nuevamente.
        </Typography>
        <Button variant="outlined" onClick={() => setIntento((actual) => actual + 1)}>
          Reintentar
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ background: "#F8FAFC", minHeight: "100vh", px: 2, py: 4 }}>
      <Box sx={{ maxWidth: 760, mx: "auto" }}>
        <Stack
          direction="row"
          sx={{ mb: 3, alignItems: "baseline", justifyContent: "space-between" }}
        >
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
            Solicitudes
          </Typography>
        </Stack>

        {solicitudes.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              border: "1px dashed #E2E8F0",
              borderRadius: 2,
              bgcolor: "#fff",
            }}
          >
            <Typography sx={{ color: "#64748B", fontWeight: 500 }}>
              Todavía no hay solicitudes cargadas.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.25}>
            {solicitudes.map((solicitud) => {
              const estado = getEstado(solicitud)
              const fechaRelevante = getFechaRelevante(solicitud)

              return (
                <Box
                  key={solicitud.id}
                  onClick={() => navigate(`/validar/${solicitud.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      navigate(`/validar/${solicitud.id}`)
                    }
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "stretch",
                    bgcolor: "#fff",
                    borderRadius: 2,
                    border: "1px solid #EEF1F5",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
                    "&:hover": {
                      borderColor: "#E2E8F0",
                      boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
                      transform: "translateY(-1px)",
                    },
                    "&:focus-visible": {
                      outline: "2px solid #2563EB",
                      outlineOffset: "2px",
                    },
                  }}
                >
                  <Box sx={{ width: 6, bgcolor: estado.accent, flexShrink: 0 }} />

                  <Box
                    sx={{
                      flex: 1,
                      px: 2.5,
                      py: 1.75,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: estado.background,
                        color: estado.text,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {estado.label}
                    </Box>

                    <Box sx={{ width: "1px", alignSelf: "stretch", bgcolor: "#F1F5F9" }} />

                    <Stack spacing={1} sx={{ flex: "1 1 200px", minWidth: 0 }}>
                      <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: "#0F172A", minWidth: 0, overflowWrap: "anywhere" }}>
                        {solicitud.titulo}
                      </Typography>
                      <LegajosSolicitud legajos={solicitud.legajos} />
                    </Stack>

                    {solicitud.equipo && (
                      <Box
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor: "#F1F5F9",
                          color: "#475569",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.02em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {solicitud.equipo.nombre}
                      </Box>
                    )}

                    <Stack
                      spacing={0}
                      sx={{ ml: "auto", minWidth: 110, alignItems: "flex-end" }}
                    >
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#334155", whiteSpace: "nowrap" }}>
                        {formatRelativo(fechaRelevante)}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>
                        {formatFechaHora(fechaRelevante)}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              )
            })}
          </Stack>
        )}
      </Box>
    </Box>
  )
}

export default SolicitudListPage

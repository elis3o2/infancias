import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Typography, Stack, CircularProgress } from '@mui/material'
import { getSolicitudSimple } from "@/features/solicitud/api"
import type { SolicitudSimple } from "@/features/solicitud/types"

// La prioridad es información real, no decoración: la usamos para
// codificar de un vistazo qué solicitudes necesitan atención primero.
const PRIORIDAD_COLORS: Record<string, { accent: string; bg: string; text: string }> = {
  urgente: { accent: "#DC2626", bg: "#FEF2F2", text: "#B91C1C" },
  prioritaria: { accent: "#D97706", bg: "#FFFBEB", text: "#B45309" },
  preventiva: { accent: "#037c13ff", bg: "#ECFEFF", text: "#05860fff" },
}

const DEFAULT_PRIORIDAD = { accent: "#64748B", bg: "#F8FAFC", text: "#475569" }

function getPrioridadStyle(nombre?: string) {
  if (!nombre) return DEFAULT_PRIORIDAD
  return PRIORIDAD_COLORS[nombre.toLowerCase()] ?? DEFAULT_PRIORIDAD
}

function getEstado(solicitud: SolicitudSimple) {
  if (solicitud.rechazado) {
    return { label: "Rechazado", bg: "#FEE2E2", text: "#991B1B" }
  }
  if (solicitud.validado) {
    return { label: "Validado", bg: "#DCFCE7", text: "#166534" }
  }
  return { label: "Pendiente", bg: "#FEF3C7", text: "#92400E" }
}

// Si la solicitud ya fue validada o rechazada, la fecha relevante para el
// caseworker es la del último cambio de estado, no la de creación.
function getFechaRelevante(solicitud: SolicitudSimple) {
  if ((solicitud.validado || solicitud.rechazado) && solicitud.fecha_hora_modificacion) {
    return solicitud.fecha_hora_modificacion
  }
  return solicitud.fecha_hora_creacion
}

function formatFecha(fecha: string | null | undefined) {
  if (!fecha) return "—"
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return fecha
  const dia = String(d.getUTCDate()).padStart(2, "0")
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0")
  const anio = d.getUTCFullYear()
  const hora = String(d.getUTCHours()).padStart(2, "0")
  const min = String(d.getUTCMinutes()).padStart(2, "0")
  return `${dia}-${mes}-${anio} ${hora}:${min}`
}

function formatRelativo(fecha: string) {
  const ahora = Date.now()
  const entonces = new Date(fecha).getTime()
  const diffMin = Math.round((ahora - entonces) / 60000)

  if (diffMin < 1) return "recién"
  if (diffMin < 60) return `${diffMin} min`
  const diffHoras = Math.round(diffMin / 60)
  if (diffHoras < 24) return `${diffHoras} h`
  const diffDias = Math.round(diffHoras / 24)
  if (diffDias === 1) return "ayer"
  if (diffDias < 30) return `${diffDias} días`
  const diffMeses = Math.round(diffDias / 30)
  return `${diffMeses} ${diffMeses === 1 ? "mes" : "meses"}`
}

export const SolicitudListPage = () => {
  const navigate = useNavigate()
  const [solicitudes, setSolicitudes] = useState<SolicitudSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchSolicitudes() {
      try {
        const data = await getSolicitudSimple()
        setSolicitudes(data)
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchSolicitudes()
  }, [])

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
          No se pudieron cargar las solicitudes
        </Typography>
        <Typography variant="body2" sx={{ color: "#94A3B8", mt: 0.5 }}>
          Volvé a intentar en unos minutos
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ background: "#F8FAFC", minHeight: "100vh", px: 2, py: 4 }}>
      <Box sx={{ maxWidth: 760, mx: "auto" }}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 3 }}>
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
              Todavía no hay solicitudes cargadas
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.25}>
            {solicitudes.map((solicitud) => {
              const prioridad = getPrioridadStyle(solicitud.prioridad?.nombre)
              const estado = getEstado(solicitud)
              const fechaRelevante = getFechaRelevante(solicitud)

              return (
                <Box
                  key={solicitud.id}
                  onClick={() => navigate(`/validar/${solicitud.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
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
                  {/* Franja de prioridad: el color codifica urgencia real, no decora */}
                  <Box sx={{ width: 6, bgcolor: prioridad.accent, flexShrink: 0 }} />

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
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 130 }}>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor: estado.bg,
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
                    </Stack>

                    {/* Divisor sutil */}
                    <Box sx={{ width: "1px", alignSelf: "stretch", bgcolor: "#F1F5F9" }} />

                    {/* Motivo: el contenido principal, se lleva el espacio flexible */}
                    <Typography
                      sx={{
                        fontSize: 14.5,
                        fontWeight: 600,
                        color: "#0F172A",
                        flex: "1 1 200px",
                        minWidth: 0,
                      }}
                      noWrap
                    >
                      {solicitud.motivo?.nombre ?? "Motivo sin especificar"}
                    </Typography>



                    {/* Derivación, si existe: chip a la izquierda de la fecha */}
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

                    {/* Fecha: siempre al final, alineada a la derecha */}
                    <Stack alignItems="flex-end" spacing={0} sx={{ ml: "auto", minWidth: 110 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#334155", whiteSpace: "nowrap" }}>
                        {formatRelativo(fechaRelevante)}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>
                        {formatFecha(fechaRelevante)}
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
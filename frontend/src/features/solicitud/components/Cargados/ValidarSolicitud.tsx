import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { getSolicitudById } from "../../api"
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import CheckCircleOutlineIcon  from "@mui/icons-material/CheckCircleOutline"
import CancelOutlinedIcon       from "@mui/icons-material/CancelOutlined"
import AttachFileIcon           from "@mui/icons-material/AttachFile"

// ── Helpers ──────────────────────────────────────────────────────────────────

const PRIORIDAD_COLOR = { 1: "error", 2: "warning", 3: "success" }

function formatFecha(str) {
  if (!str) return "—"
  try {
    return new Date(str).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    })
  } catch { return str }
}

function descargarArchivo(archivo) {
  const url = URL.createObjectURL(archivo.contenido)
  const a   = document.createElement("a")
  a.href = url
  a.download = archivo.nombre
  a.click()
  URL.revokeObjectURL(url)
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

/** Sección con título y contenido */
function Seccion({ titulo, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {titulo}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Paper>
  )
}

/** Par etiqueta / valor */
function Campo({ label, value }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value ?? "—"}</Typography>
    </Stack>
  )
}

/** Lista de instituciones de una red */
function ListaInstituciones({ instituciones = [] }) {
  if (instituciones.length === 0)
    return <Typography variant="body2" color="text.disabled">Sin instituciones</Typography>
  return (
    <List dense disablePadding>
      {instituciones.map((inst, i) => (
        <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
          <ListItemText
            primary={inst.nombre ?? inst}
            primaryTypographyProps={{ variant: "body2" }}
          />
        </ListItem>
      ))}
    </List>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export const ValidarSolicitud = () => {
  const { id } = useParams()
  const [solicitud, setSolicitud] = useState(null)
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
            {solicitud.fecha_hora_cambio && (
              <Typography variant="caption" color="text.secondary">
                Modificada: {formatFecha(solicitud.fecha_hora_cambio)}
              </Typography>
            )}
          </Stack>
        </Box>

        {/* ── Estado ── */}
        {solicitud.validado && (
          <Alert severity="success" icon={<CheckCircleOutlineIcon />}>
            Esta solicitud fue validada.
          </Alert>
        )}
        {solicitud.rechazado && (
          <Alert severity="error" icon={<CancelOutlinedIcon />}>
            Esta solicitud fue rechazada.
          </Alert>
        )}
        {!solicitud.validado && !solicitud.rechazado && (
          <Alert severity="warning">Solicitud pendiente de validación.</Alert>
        )}

        {/* ── Institución ── */}
        <Seccion titulo="Institución solicitante">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Campo label="Nombre" value={solicitud.institucion?.nombre} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="Tipo"   value={solicitud.institucion?.tipo} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="Dirección" value={solicitud.institucion?.direccion} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="Teléfono" value={solicitud.institucion?.telefono} />
            </Grid>
          </Grid>
        </Seccion>

        {/* ── Solicitante ── */}
        <Seccion titulo="Solicitante">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Campo label="Nombre"   value={solicitud.solicitante?.nombre} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="Apellido" value={solicitud.solicitante?.apellido} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="DNI"      value={solicitud.solicitante?.dni} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="Cargo"    value={solicitud.solicitante?.cargo} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="Teléfono" value={solicitud.solicitante?.telefono} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="Email"    value={solicitud.solicitante?.email} />
            </Grid>
          </Grid>
        </Seccion>

        {/* ── Adolescente ── */}
        <Seccion titulo="Adolescente">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Campo label="Nombre"        value={solicitud.adolescente?.nombre} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="Apellido"      value={solicitud.adolescente?.apellido} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="DNI"           value={solicitud.adolescente?.dni} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="Fecha de nac." value={solicitud.adolescente?.fecha_nacimiento} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="Domicilio"     value={solicitud.adolescente?.domicilio} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="Escuela"       value={solicitud.adolescente?.escuela} />
              
            </Grid>
          </Grid>
        </Seccion>

        {/* ── Hermanos ── */}
        {solicitud.hermanos?.length > 0 && (
          <Seccion titulo={`Hermanos (${solicitud.hermanos.length})`}>
            <Stack spacing={1.5} divider={<Divider />}>
              {solicitud.hermanos.map((h, i) => (
                <Grid container spacing={2} key={i}>
                  <Grid item xs={12} sm={4}>
                    <Campo label="Nombre"  value={h.nombre} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Campo label="Apellido" value={h.apellido} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Campo label="Fecha de nac." value={h.fecha_nacimiento} />
                  </Grid>
                </Grid>
              ))}
            </Stack>
          </Seccion>
        )}

        {/* ── Descripción ── */}
        <Seccion titulo="Descripción">
          <Typography variant="body2" whiteSpace="pre-wrap">
            {solicitud.descripcion || "Sin descripción."}
          </Typography>
        </Seccion>

        {/* ── Redes ── */}
        <Seccion titulo="Redes de intervención">
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Salud
              </Typography>
              <ListaInstituciones instituciones={solicitud.redes?.salud} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Educación
              </Typography>
              <ListaInstituciones instituciones={solicitud.redes?.educacion} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Cultural
              </Typography>
              <ListaInstituciones instituciones={solicitud.redes?.cultural} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Otros
              </Typography>
              <ListaInstituciones instituciones={solicitud.redes?.otros} />
            </Grid>
          </Grid>
        </Seccion>

        {/* ── Archivos ── */}
        {solicitud.archivos?.length > 0 && (
          <Seccion titulo={`Archivos (${solicitud.archivos.length})`}>
            <List dense disablePadding>
              {solicitud.archivos.map((archivo) => (
                <ListItem
                  key={archivo.id}
                  disableGutters
                  secondaryAction={
                    <Chip
                      icon={<AttachFileIcon />}
                      label="Descargar"
                      size="small"
                      variant="outlined"
                      onClick={() => descargarArchivo(archivo)}
                      sx={{ cursor: "pointer" }}
                    />
                  }
                >
                  <ListItemText
                    primary={archivo.nombre}
                    secondary={archivo.tipo_mime}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              ))}
            </List>
          </Seccion>
        )}

      </Stack>
    </Container>
  )
}
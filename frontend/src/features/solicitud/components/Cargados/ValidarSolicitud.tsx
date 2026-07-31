import { useState, useEffect, type Dispatch, type SetStateAction } from "react"
import { useParams } from "react-router-dom"
import { getSolicitudById } from "../../api"
import { getCiudadano,getSalud } from "@/features/persona/api"
import  type { Salud } from "@/features/persona/types"
import {
  Alert,
  Box,
  Button,
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
import CheckCircleOutlinedIcon  from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlinedIcon       from "@mui/icons-material/CancelOutlined"
import AttachFileIcon           from "@mui/icons-material/AttachFile"
import FactCheckOutlinedIcon    from "@mui/icons-material/FactCheckOutlined"
import type { Solicitud } from "../../types";
import type { Ciudadano } from "@/features/persona/types"

type EstadoValidacion = {
  data: Ciudadano | null
  loading: boolean
  error: string | null
}

type EstadoValidacionSalud = {
  data: Salud | null
  loading: boolean
  error: string | null
}

const ESTADO_INICIAL: EstadoValidacion = { data: null, loading: false, error: null }
const ESTADO_INICIAL_SALUD: EstadoValidacionSalud = { data: null, loading: false, error: null }

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
}/**
 * Muchos campos del backend vienen serializados como relaciones
 * ({ id, nombre }) en lugar de strings planos (ej. tipo, cargo,
 * escuela, domicilio). Esta función normaliza cualquiera de los
 * dos casos a algo que React pueda renderizar directamente.
 */
function textoPlano(value) {
  if (value === null || value === undefined) return null
  if (typeof value === "object") {
    if ("nombre" in value) return value.nombre
    if ("descripcion" in value) return value.descripcion
    // objeto sin una propiedad de texto reconocible: evita el crash,
    // pero conviene loguearlo para ajustar el mapeo real más adelante
    console.warn("Campo recibió un objeto sin 'nombre'/'descripcion':", value)
    return JSON.stringify(value)
  }
  return value
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

/** Sección con título y contenido */
function Seccion({ titulo, accion, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Typography variant="subtitle2" color="text.secondary">
          {titulo}
        </Typography>
        {accion}
      </Stack>
      <Divider sx={{ my: 2 }} />
      {children}
    </Paper>
  )
}

/** Botón de validación contra el padrón + resultado inline */
function BotonValidar({ onClick, estado }: { onClick: () => void; estado: EstadoValidacion }) {
  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={
        estado.loading
          ? <CircularProgress size={14} />
          : <FactCheckOutlinedIcon fontSize="small" />
      }
      disabled={estado.loading}
      onClick={onClick}
    >
      Validar
    </Button>
  )
}

/** Resultado de la validación contra el padrón, con los campos indicados */
function ResultadoValidacion({ estado, campos }: { estado: EstadoValidacion; campos: string[] }) {
  if (estado.error)
    return <Alert severity="error" sx={{ mt: 2 }}>{estado.error}</Alert>

  if (!estado.data) return null

  return (
    <Grid container spacing={2} sx={{ mt: 0.5 }}>
      {campos.includes("nombre") && (
        <Grid item xs={12} sm={6}>
          <Campo label="Nombre (padrón)" value={estado.data.nombre} />
        </Grid>
      )}
      {campos.includes("apellido") && (
        <Grid item xs={12} sm={6}>
          <Campo label="Apellido (padrón)" value={estado.data.apellido} />
        </Grid>
      )}
      {campos.includes("fechaNacimiento") && (
        <Grid item xs={12} sm={6}>
          <Campo label="Fecha de nacimiento (padrón)" value={formatFecha(estado.data.fechaNacimiento)} />
        </Grid>
      )}
    </Grid>
  )
}

/** Resultado de la validación de salud: efectores adscriptos */
function ResultadoSalud({ estado }: { estado: EstadoValidacionSalud }) {
  if (estado.loading)
    return (
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }}>
        <CircularProgress size={14} />
        <Typography variant="caption" color="text.secondary">Consultando salud…</Typography>
      </Stack>
    )

  if (estado.error)
    return <Alert severity="error" sx={{ mt: 2 }}>{estado.error}</Alert>

  if (!estado.data) return null

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
        Efectores adscriptos
      </Typography>
      {estado.data.efectores?.length > 0 ? (
        <List dense disablePadding>
          {estado.data.efectores.map((efector, i) => (
            <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
              <ListItemText primary={efector} primaryTypographyProps={{ variant: "body2" }} />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.disabled">Sin efectores adscriptos</Typography>
      )}
    </Box>
  )
}

/** Par etiqueta / valor */
function Campo({ label, value }) {
  const display = textoPlano(value)
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{display ?? "—"}</Typography>
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
            primary={textoPlano(inst) ?? "—"}
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
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const [validacionSolicitante, setValidacionSolicitante] = useState<EstadoValidacion>(ESTADO_INICIAL)
  const [validacionAdolescente, setValidacionAdolescente] = useState<EstadoValidacion>(ESTADO_INICIAL)
  const [validacionSalud, setValidacionSalud] = useState<EstadoValidacionSalud>(ESTADO_INICIAL_SALUD)

  // Nota: getCiudadano requiere dni y sexo. Asumo que ambas entidades
  // ya traen un campo `sexo` ("M" | "F") desde el backend; si el nombre
  // real del campo es otro, solo hay que ajustar las dos líneas de abajo.
  async function validar(
    dni: string | undefined,
    sexo: string | undefined,
    setEstado: Dispatch<SetStateAction<EstadoValidacion>>
  ) {
    if (!dni || !sexo) {
      setEstado({ data: null, loading: false, error: "Falta DNI o sexo para validar." })
      return
    }
    setEstado({ data: null, loading: true, error: null })
    try {
      const data = await getCiudadano(dni, sexo)
      setEstado({ data, loading: false, error: null })
      console.log(data)
    } catch (e: any) {
      setEstado({ data: null, loading: false, error: e?.message ?? "Error al validar contra el padrón" })
    }
  }

  async function validarSalud(dni: string | undefined, sexo: string | undefined) {
    if (!dni || !sexo) {
      setValidacionSalud({ data: null, loading: false, error: "Falta DNI o sexo para validar salud." })
      return
    }
    setValidacionSalud({ data: null, loading: true, error: null })
    try {
      const data = await getSalud(dni, sexo)
      setValidacionSalud({ data, loading: false, error: null })
    } catch (e: any) {
      setValidacionSalud({ data: null, loading: false, error: e?.message ?? "Error al validar salud" })
    }
  }

  // Dispara ambas validaciones (padrón + salud) en paralelo
  function validarAdolescente() {
    validar(solicitud?.adolescente?.dni, solicitud?.adolescente?.sexo, setValidacionAdolescente)
    validarSalud(solicitud?.adolescente?.dni, solicitud?.adolescente?.sexo)
  }

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
          <Alert severity="success" icon={<CheckCircleOutlinedIcon />}>
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
          </Grid>
        </Seccion>

        {/* ── Solicitante ── */}
        <Seccion
          titulo="Solicitante"
          accion={
            <BotonValidar
              estado={validacionSolicitante}
              onClick={() =>
                validar(
                  solicitud.solicitante?.dni,
                  solicitud.solicitante?.sexo,
                  setValidacionSolicitante
                )
              }
            />
          }
        >
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
              <Campo label="Teléfono" value={solicitud.solicitante?.telefono} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="Email"    value={solicitud.solicitante?.correo} />
            </Grid>
          </Grid>
          <ResultadoValidacion estado={validacionSolicitante} campos={["nombre", "apellido"]} />
        </Seccion>

        {/* ── Adolescente ── */}
        <Seccion
          titulo="Adolescente"
          accion={
            <BotonValidar
              estado={validacionAdolescente}
              onClick={validarAdolescente}
            />
          }
        >
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
              <Campo label="Fecha de nacimiento" value={formatFecha(solicitud.adolescente?.fecha_nacimiento)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Campo label="Domicilio"     value={solicitud.adolescente?.domicilio} />
            </Grid>
          </Grid>
          <ResultadoValidacion
            estado={validacionAdolescente}
            campos={["nombre", "apellido", "fechaNacimiento"]}
          />
          <ResultadoSalud estado={validacionSalud} />
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
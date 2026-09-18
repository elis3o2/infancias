import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material"
import type {
  Familiar,
  FamiliarResp,
  PersonaCreate,
  PersonaResp,
  RelacionResp,
} from "../../types"
import type { DomicilioFormData } from "@/features/domicilio/types"
import { FamiliarList } from "../Familiar/FamiliarList"
import { CiudadanoList } from "./CiudadanoList"
import { ciudadanoToPersona } from "../../utils"
import { formatFecha } from "@/common/utils"

type Estado = "confirmado" | "rechazado" | null

type Props = {
  familiar: Familiar
  estado: Estado
  setEstado: (estado: Estado) => void
  setPersona: (persona: PersonaCreate | null) => void
  resultado: FamiliarResp | null
  busquedaRealizada: boolean
}

const domicilioAFormulario = (domicilio: Familiar["domicilio"]): DomicilioFormData | null => {
  if (!domicilio) return null

  return {
    nombre: domicilio.nombre,
    observaciones: domicilio.observaciones,
    id_departamento: domicilio.departamento?.id ?? null,
    // The submitted domicile can have a server-only shape. A new validation
    // must not pretend that its geocoding is safe to send back unchanged.
    domicilio_validado: null,
  }
}

const personaRegistradaAFormulario = (
  persona: PersonaResp,
  familiar: Familiar,
): PersonaCreate => ({
  nombre: persona.nombre,
  apellido: persona.apellido,
  dni: persona.dni,
  sexo: persona.sexo,
  fecha_nacimiento: persona.fecha_nacimiento,
  telefono: familiar.telefono,
  domicilio: domicilioAFormulario(familiar.domicilio),
  vinculo: familiar.vinculo,
  id_familiar: familiar.id,
  id_vinculo: familiar.vinculo.id,
  legajo:
    persona.legajo !== null || persona.carpeta !== null
      ? {
          id_insert: persona.legajo,
          carpeta_id: persona.carpeta,
        }
      : null,
})

const ciudadanoAFormulario = (ciudadano: NonNullable<FamiliarResp["ciudadano"]>, familiar: Familiar) => ({
  ...ciudadanoToPersona(ciudadano),
  telefono: familiar.telefono,
  domicilio: domicilioAFormulario(familiar.domicilio),
  vinculo: familiar.vinculo,
  id_familiar: familiar.id,
  id_vinculo: familiar.vinculo.id,
})

const DatosInternos = ({ persona, relaciones = [] }: { persona: PersonaResp; relaciones?: RelacionResp[] }) => (
  <Stack spacing={1.5}>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
        gap: 1,
      }}
    >
      {[
        ["Nombre", `${persona.nombre} ${persona.apellido}`],
        ["DNI", persona.dni],
        ["Sexo", persona.sexo],
        ["Fecha de nacimiento", formatFecha(persona.fecha_nacimiento)],
      ].map(([etiqueta, valor]) => (
        <Box key={etiqueta} sx={{ p: 1.25, borderRadius: 2, bgcolor: "action.hover" }}>
          <Typography variant="caption" color="text.secondary">
            {etiqueta}
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{valor}</Typography>
        </Box>
      ))}
    </Box>

    {relaciones.length > 0 && (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 700 }}>
          Relaciones registradas
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          {relaciones.map((relacion, index) => (
            <Chip
              key={`${relacion.persona.dni}-${index}`}
              label={`${relacion.vinculo}: ${relacion.persona.nombre} ${relacion.persona.apellido}`}
              variant="outlined"
              size="small"
            />
          ))}
        </Stack>
      </Box>
    )}
  </Stack>
)

/**
 * Shows the result collected by the page-wide identity lookup. A missing
 * RENAPER result is informational: it never changes a relative to rejected.
 */
export const ValidarFamiliarDatos = ({
  familiar,
  estado,
  setEstado,
  setPersona,
  resultado,
  busquedaRealizada,
}: Props) => {
  const confirmarPersonaInterna = () => {
    if (!resultado?.persona) return
    setPersona(personaRegistradaAFormulario(resultado.persona, familiar))
    setEstado("confirmado")
  }

  const confirmarCiudadano = () => {
    if (!resultado?.ciudadano) return
    setPersona(ciudadanoAFormulario(resultado.ciudadano, familiar))
    setEstado("confirmado")
  }

  const rechazar = () => {
    setPersona(null)
    setEstado("rechazado")
  }

  const limpiar = () => {
    setPersona(null)
    setEstado(null)
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          md: "minmax(0, 0.85fr) minmax(0, 1.15fr)",
        },
        gap: { xs: 2, md: 3 },
        alignItems: "start",
      }}
    >
      <Box
        sx={{
          minWidth: 0,
          p: { xs: 1.5, sm: 2 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2.5,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
          Datos cargados del familiar o referente
        </Typography>
        <FamiliarList familiar={familiar} />
      </Box>

      <Box
        sx={{
          minWidth: 0,
          p: { xs: 1.5, sm: 2 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2.5,
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Resultado de la verificación
          </Typography>

          {resultado?.persona ? (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Persona encontrada en el sistema
              </Typography>
              <DatosInternos persona={resultado.persona} relaciones={resultado.relaciones} />
              <AccionesValidacion
                estado={estado}
                onConfirmar={confirmarPersonaInterna}
                onRechazar={rechazar}
                onLimpiar={limpiar}
                confirmarLabel="Confirmar datos registrados"
              />
            </>
          ) : resultado?.ciudadano ? (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Datos encontrados en RENAPER
              </Typography>
              <CiudadanoList ciudadano={resultado.ciudadano} />
              {resultado.ciudadano.fallecido === "SI" && (
                <Alert severity="warning">RENAPER informa que la persona está fallecida.</Alert>
              )}
              <AccionesValidacion
                estado={estado}
                onConfirmar={confirmarCiudadano}
                onRechazar={rechazar}
                onLimpiar={limpiar}
              />
            </>
          ) : busquedaRealizada ? (
            <>
              <Alert severity="info">
                No se encontraron datos previos ni datos en RENAPER. Esta persona queda pendiente de
                validación; no fue rechazada automáticamente.
              </Alert>
              {estado !== null ? (
                <AccionesValidacion
                  estado={estado}
                  onConfirmar={() => undefined}
                  onRechazar={rechazar}
                  onLimpiar={limpiar}
                />
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={rechazar}
                  sx={{ alignSelf: "flex-start", width: { xs: "100%", sm: "auto" } }}
                >
                  Rechazar datos manualmente
                </Button>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Usá “Buscar datos” para consultar el sistema y RENAPER.
            </Typography>
          )}
        </Stack>
      </Box>
    </Box>
  )
}

type AccionesProps = {
  estado: Estado
  onConfirmar: () => void
  onRechazar: () => void
  onLimpiar: () => void
  confirmarLabel?: string
}

const AccionesValidacion = ({
  estado,
  onConfirmar,
  onRechazar,
  onLimpiar,
  confirmarLabel = "Confirmar datos",
}: AccionesProps) => {
  if (estado !== null) {
    return (
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "stretch", sm: "center" } }}
      >
        <Chip
          color={estado === "confirmado" ? "success" : "error"}
          label={estado === "confirmado" ? "Datos confirmados" : "Datos rechazados"}
          size="small"
          sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
        />
        <Button size="small" onClick={onLimpiar} sx={{ width: { xs: "100%", sm: "auto" } }}>
          Revisar nuevamente
        </Button>
      </Stack>
    )
  }

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <Button variant="contained" size="small" onClick={onConfirmar} sx={{ width: { xs: "100%", sm: "auto" } }}>
        {confirmarLabel}
      </Button>
      <Button variant="outlined" color="error" size="small" onClick={onRechazar} sx={{ width: { xs: "100%", sm: "auto" } }}>
        Rechazar datos
      </Button>
    </Stack>
  )
}

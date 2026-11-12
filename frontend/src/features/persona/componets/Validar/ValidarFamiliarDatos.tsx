import { Alert, Box, Button, Stack, Typography } from "@mui/material"
import type {
  Familiar,
  PersonaCreate,
} from "../../types"
import type { FamiliarResp, PersonaResp } from "@/features/api_externa/types"
import type { DomicilioFormData } from "@/features/domicilio/types"
import { FamiliarList } from "../Familiar/FamiliarList"
import { CiudadanoList } from "./CiudadanoList"
import { ciudadanoToPersona, personaRegistradaAFormulario as personaRegistrada } from "../../utils"
import { DatosPersonaEncontrada } from "./DatosPersonaEncontrada"
import { AccionesValidacion } from "./AccionesValidacion"

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
  ...personaRegistrada(persona),
  telefono: familiar.telefono,
  domicilio: domicilioAFormulario(familiar.domicilio),
  vinculo: familiar.vinculo,
  id_familiar: familiar.id,
  id_vinculo: familiar.vinculo?.id,
  legajo: null,
})

const ciudadanoAFormulario = (ciudadano: NonNullable<FamiliarResp["ciudadano"]>, familiar: Familiar) => ({
  ...ciudadanoToPersona(ciudadano),
  telefono: familiar.telefono,
  domicilio: domicilioAFormulario(familiar.domicilio),
  vinculo: familiar.vinculo,
  id_familiar: familiar.id,
  id_vinculo: familiar.vinculo?.id,
})

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
              <DatosPersonaEncontrada persona={resultado.persona} relaciones={resultado.relaciones} />
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
              <Alert severity="warning">
                Persona no validada. No se pudo verificar su identidad.
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

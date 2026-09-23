import type { AdolescenteCrud, PersonaCreate } from "../../types"
import type { Ciudadano, PersonaResp, RelacionResp, SolicitudResp } from "@/features/api_externa/types"

import { Alert, Box, Button, Stack, Typography } from "@mui/material"
import { Mapa } from "@/features/domicilio/components/Mapa"
import { TitledCard } from "@/common/components/TitleCard"
import { AdolescenteList } from "../Adolescente/AdolescenteList"
import { AdolescenteDatosCargados } from "./AdolescentaDatosCargados"
import { ValidarCiudadano } from "./ValidarCiudadano"
import { ciudadanoToPersona } from "../../utils"


type Props = {
  adolescente: AdolescenteCrud
  estado: "confirmado" | "rechazado" | null
  setEstado: (estado: "confirmado" | "rechazado" | null) => void
  persona: PersonaCreate | null
  setPersona: (persona: PersonaCreate | null) => void
  personaresp: PersonaResp | null
  ciudadano: Ciudadano | null
  relaciones: RelacionResp[]
  solicitudes: SolicitudResp[]
  sinResultados: boolean
}

const personaRegistradaAForm = (persona: PersonaResp): PersonaCreate => ({
  nombre: persona.nombre,
  apellido: persona.apellido,
  dni: persona.dni,
  sexo: persona.sexo,
  fecha_nacimiento: persona.fecha_nacimiento,
  telefono: null,
  domicilio: null,
  vinculo: null,
  legajo: persona.legajo !== null || persona.carpeta !== null
    ? {
        id_insert: persona.legajo,
        carpeta_id: persona.carpeta,
      }
    : null,
})

export const ValidarAdolescente = ({ adolescente, estado, setEstado, persona, setPersona,
  personaresp, ciudadano, relaciones, solicitudes, sinResultados, }: Props) => {

  const confirmarDatosCiudadano = () => {
    if (!ciudadano) return

    // The operator may have added a legajo/carpeta before confirming. Keep
    // that draft instead of recreating it from the RENAPER response.
    setPersona(persona ?? ciudadanoToPersona(ciudadano))

    setEstado("confirmado")
  }

  const confirmarDatosInternos = () => {
    if (!personaresp) return

    const datos = personaRegistradaAForm(personaresp)
    setPersona({ ...datos, legajo: persona?.legajo ?? datos.legajo })
    setEstado("confirmado")
  }

  const rechazarDatos = () => {
    setPersona(null)
    setEstado("rechazado")
  }

  const leyendaEstado = () => {
    switch (estado) {
      case "confirmado":
        return { texto: "Datos confirmados", color: "success.main" }

      case "rechazado":
        return { texto: "Datos rechazados", color: "error.main" }

      default:
        return {
          texto: "Pendiente de validación",
          color: "text.secondary",
        }
    }
  }

  const estadoActual = leyendaEstado()
  const tieneResultado = Boolean(personaresp || ciudadano || sinResultados)

  const acciones = (onConfirmar: () => void, etiquetaConfirmar: string) => (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      sx={{
        alignItems: { xs: "stretch", sm: "center" },
        "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: estadoActual.color, fontWeight: 700, mr: { sm: "auto" } }}
      >
        {estadoActual.texto}
      </Typography>
      <Button variant="outlined" color="error" onClick={rechazarDatos}>
        Rechazar datos
      </Button>
      <Button variant="contained" onClick={onConfirmar}>
        {etiquetaConfirmar}
      </Button>
    </Stack>
  )

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
      <TitledCard
        titulo="Datos del niño, niña o adolescente"
        sx={{ minWidth: 0 }}
        componente={
          <Stack spacing={2}>
            <AdolescenteList adolescente={adolescente} />

            {adolescente.domicilio?.domicilio_validado && (
              <Mapa
                latitud={adolescente.domicilio.domicilio_validado.latitud}
                longitud={adolescente.domicilio.domicilio_validado.longitud}
                nombre={adolescente.domicilio.nombre}
              />
            )}
          </Stack>
        }
      />

      <Stack spacing={2} sx={{ minWidth: 0 }}>
        {personaresp && (
          <>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              Resultado de la verificación
            </Typography>
            <AdolescenteDatosCargados
              solicitudes={solicitudes}
              relaciones={relaciones}
              persona={personaresp}
            />
            {acciones(confirmarDatosInternos, "Confirmar datos registrados")}
          </>
        )}

        {!personaresp && ciudadano && (
          <>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              Resultado de la verificación
            </Typography>
            <ValidarCiudadano
              ciudadano={ciudadano}
              persona={persona ?? ciudadanoToPersona(ciudadano)}
              setPersona={setPersona}
            />
            {acciones(confirmarDatosCiudadano, "Confirmar datos")}
          </>
        )}

        {sinResultados && (
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              bgcolor: "background.paper",
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Resultado de la verificación
              </Typography>
              <Alert severity="info">
                No se encontraron datos previos ni datos en RENAPER para esta persona. Queda pendiente
                de validación; no fue rechazada automáticamente.
              </Alert>
              {estado !== null ? (
                <Button size="small" onClick={() => setEstado(null)} sx={{ alignSelf: "flex-start" }}>
                  Revisar nuevamente
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={rechazarDatos}
                  sx={{ alignSelf: "flex-start", width: { xs: "100%", sm: "auto" } }}
                >
                  Rechazar datos manualmente
                </Button>
              )}
            </Stack>
          </Box>
        )}

        {!tieneResultado && (
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 3,
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Resultado de la verificación
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Usá “Buscar datos” para consultar los antecedentes y los datos de RENAPER.
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  )
}

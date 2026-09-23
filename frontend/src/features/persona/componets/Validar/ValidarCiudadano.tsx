import { useState } from "react"
import { Box, Stack, Typography } from "@mui/material"
import type { PersonaCreate } from "../../types"
import type { Ciudadano } from "@/features/api_externa/types"
import { TitledCard } from "@/common/components/TitleCard"
import { LegajoForm } from "./LegajoForm"
import { CiudadanoList } from "./CiudadanoList"

type Props = {
  ciudadano: Ciudadano
  /** Draft that will be sent only after the operator confirms the identity. */
  persona: PersonaCreate
  setPersona: (persona: PersonaCreate) => void
}

const crearLegajoVacio = (): NonNullable<PersonaCreate["legajo"]> => ({
  id_insert: null,
  carpeta_id: null,
})

/**
 * Presents the RENAPER result and keeps the optional expediente data in the
 * same draft that the parent confirmation action uses.
 */
export const ValidarCiudadano = ({ ciudadano, persona, setPersona }: Props) => {
  const [tieneLegajo, setTieneLegajo] = useState(Boolean(persona.legajo))

  const actualizarLegajo = (
    cambios: Partial<NonNullable<PersonaCreate["legajo"]>>,
  ) => {
    setPersona({
      ...persona,
      legajo: {
        ...(persona.legajo ?? crearLegajoVacio()),
        ...cambios,
      },
    })
  }

  const cambiarTieneLegajo = (valor: boolean) => {
    setTieneLegajo(valor)
    setPersona({
      ...persona,
      legajo: valor ? persona.legajo ?? crearLegajoVacio() : null,
    })
  }

  return (
    <TitledCard
      titulo="Datos encontrados en RENAPER"
      componente={
        <Stack spacing={2}>
          <CiudadanoList ciudadano={ciudadano} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              gap: 1,
            }}
          >
            <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "action.hover" }}>
              <Typography variant="caption" color="text.secondary">
                Historia clínica familiar
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>{ciudadano.hcf ?? "—"}</Typography>
            </Box>
          </Box>

          <LegajoForm
            legajo={persona.legajo?.id_insert ?? null}
            setLegajo={(valor) => actualizarLegajo({ id_insert: valor })}
            carpeta={persona.legajo?.carpeta_id ?? null}
            setCarpeta={(valor) => actualizarLegajo({ carpeta_id: valor })}
            tieneLegajo={tieneLegajo}
            setTieneLegajo={cambiarTieneLegajo}
          />
        </Stack>
      }
    />
  )
}

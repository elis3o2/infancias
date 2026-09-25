import { Alert, Box, Stack, Typography } from "@mui/material"
import { PersonaList } from "@/features/persona/componets/Persona/PersonaList"
import { DatosSalud } from "@/features/persona/componets/DatosSalud"
import { LegajoForm } from "@/features/persona/componets/Validar/LegajoForm"
import { VinculoForm } from "@/features/persona/componets/VinculoForm"
import type { PersonaCreate } from "@/features/persona/types"
import type { TipoAltaAdmision } from "../../admision"
import { ContactoFamiliar } from "./validacion/ContactoFamiliar"

type Props = {
  tipo: TipoAltaAdmision
  persona: PersonaCreate
  legajoRegistrado: boolean
  onChange: (persona: PersonaCreate) => void
}

export function DatosPersonaAdmision({ tipo, persona, legajoRegistrado, onChange }: Props) {
  const adolescente = tipo === "adolescente"
  const cambiarLegajo = (cambios: Partial<NonNullable<PersonaCreate["legajo"]>> | null) => {
    onChange({ ...persona, legajo: cambios === null ? null : {
      id_insert: persona.legajo?.id_insert ?? null, carpeta_id: persona.legajo?.carpeta_id ?? null, ...cambios,
    } })
  }
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, minWidth: 0 }}>
      <Stack spacing={2} sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1">Datos consultados</Typography>
        <PersonaList persona={persona} />
        <DatosSalud persona={persona} />
      </Stack>
      <Stack spacing={2} sx={{ minWidth: 0 }}>
        <VinculoForm adolescente={adolescente} vinculoSeleccionado={persona.vinculo}
          setVinculoSeleccionado={(vinculo) => onChange({ ...persona, vinculo })} />
        {adolescente && <Alert severity="info">El domicilio es obligatorio. El legajo debe compartir la carpeta de la solicitud.</Alert>}
        <ContactoFamiliar persona={persona} familiar={null} onChange={onChange} />
        {adolescente && (legajoRegistrado ? (
          <Alert severity="info">Legajo registrado: {persona.legajo?.id_insert ?? "—"}. Carpeta: {persona.legajo?.carpeta_id ?? "—"}.
            Se conservarán si pertenecen a la misma carpeta de la solicitud.</Alert>
        ) : (
          <LegajoForm tieneLegajo={persona.legajo !== null} setTieneLegajo={(valor) => cambiarLegajo(valor ? {} : null)}
            legajo={persona.legajo?.id_insert ?? null} setLegajo={(id_insert) => cambiarLegajo({ id_insert })}
            carpeta={persona.legajo?.carpeta_id ?? null} setCarpeta={(carpeta_id) => cambiarLegajo({ carpeta_id })} />
        ))}
      </Stack>
    </Box>
  )
}

import { Alert, Box, Chip, Stack, Typography } from "@mui/material"
import { TitledCard } from "@/common/components/TitleCard"
import { InstitucionesList } from "@/features/domicilio/components/Institucion/InstitucionesList"
import { AdolescenteCard } from "@/features/persona/componets/Adolescente/AdolescenteCard"
import { PersonaCard } from "@/features/persona/componets/Persona/PersonaCard"
import type { Familiar } from "@/features/persona/types"
import type { AdolescenteSolicitud } from "../../types"
import { FamiliaresDetalle } from "./FamiliaresDetalle"

type Props = {
  adolescente: AdolescenteSolicitud
  familiares: Familiar[]
  validada: boolean
}

export const AdolescenteDetalle = ({ adolescente, familiares, validada }: Props) => (
  <Stack
    component="section"
    aria-label={`${adolescente.nombre} ${adolescente.apellido}`}
    spacing={2}
    sx={{ p: { xs: 1.5, sm: 2.5 }, border: 1, borderColor: "divider", borderRadius: 3, minWidth: 0 }}
  >
    <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
        {adolescente.nombre} {adolescente.apellido}
      </Typography>
      {validada && (
        <Chip
          size="small"
          label={adolescente.persona ? "Validado" : "Sin validar"}
          color={adolescente.persona ? "success" : "default"}
          variant="outlined"
        />
      )}
    </Stack>

    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
      <Stack spacing={2} sx={{ minWidth: 0 }}>
        {validada && adolescente.persona ? (
          <PersonaCard persona={adolescente.persona} titulo="Datos del niño, niña o adolescente validado" />
        ) : (
          <AdolescenteCard adolescente={adolescente} />
        )}
      </Stack>

      <Stack spacing={2} sx={{ minWidth: 0 }}>
        {familiares.length > 0 ? (
          <FamiliaresDetalle familiares={familiares} validada={validada} />
        ) : (
          <Alert severity="info">Sin familiares o referentes asociados.</Alert>
        )}
        {(adolescente.referencias_instituciones ?? []).length > 0 && (
          <TitledCard
            titulo="Instituciones de referencia"
            componente={<InstitucionesList instituciones={adolescente.referencias_instituciones} />}
          />
        )}
      </Stack>
    </Box>
  </Stack>
)

import { Box, Chip, Divider, Stack } from "@mui/material"
import { TitledCard } from "@/common/components/TitleCard"
import { FamiliarList } from "@/features/persona/componets/Familiar/FamiliarList"
import type { Familiar } from "@/features/persona/types"

type Props = {
  familiares: Familiar[]
  validada?: boolean
}

export const FamiliaresDetalle = ({ familiares, validada = false }: Props) => {
  if (familiares.length === 0) return null

  return (
    <TitledCard
      titulo={`Familiares / referentes (${familiares.length})`}
      componente={
        <Stack spacing={2} divider={<Divider />}>
          {familiares.map((familiar) => {
            const persona = validada ? familiar.persona : null
            const datos = persona ? {
              ...familiar,
              nombre: persona.nombre,
              apellido: persona.apellido,
              dni: persona.dni,
              sexo: persona.sexo,
              telefono: persona.telefono ?? familiar.telefono,
              domicilio: persona.domicilio ?? familiar.domicilio,
            } : familiar

            return (
              <Box key={familiar.id} sx={{ minWidth: 0 }}>
                {validada && (
                  <Chip
                    size="small"
                    label={persona ? "Validado" : "Sin validar"}
                    color={persona ? "success" : "default"}
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                )}
                <FamiliarList familiar={datos} />
              </Box>
            )
          })}
        </Stack>
      }
    />
  )
}

import { Stack, Divider, Box } from "@mui/material"
import type { Institucion, InstitucionFormData } from "@/features/domicilio/types"
import { InstitucionList } from "./InstitucionList"

type Props = {
  instituciones: InstitucionFormData[] | Institucion[]
  onEliminar?: (n: number) => void
}

export const InstitucionesList = ({instituciones, onEliminar }: Props) => {
  return (
      <Stack spacing={2}>
        {instituciones.map((institucion, index) => (
          <Box key={index}>
            <InstitucionList
              institucion={institucion}
              {...(onEliminar != null && {onEditar: () => onEliminar(index)})}
            />

            {index < instituciones.length - 1 && (
              <Divider sx={{ mt: 2 }} />
            )}
          </Box>
        ))}
      </Stack>
  );
};
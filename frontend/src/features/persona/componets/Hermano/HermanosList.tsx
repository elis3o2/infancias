import type { HermanoCreate } from "../../types"
import { Stack, Divider, Box } from "@mui/material"
import { ListData } from "@/common/components/ListData"

type Props = {
  hermanos: HermanoCreate[]
  onEliminar?: (n: number) => void
}

export const HermanosList = ({ hermanos, onEliminar }: Props) => {
  return (
    <Stack spacing={2}>
      {hermanos.map((hermano, index) => (
          <Box key={index}>
          <ListData
              dni={hermano.dni}
              nombre={hermano.nombre}
              apellido={hermano.apellido }
              fecha_nacimiento={hermano.fecha_nacimiento}
              {...(hermano.sexo != "" && { sexo: hermano.sexo })}
              {...(onEliminar != null && {onEditar: () => onEliminar(index) })}
              texto="Eliminar"
          />
          {index < hermanos.length - 1 && (
              <Divider sx={{ mt: 2 }} />
          )}
          </Box>
      ))}
    </Stack>
  )
}
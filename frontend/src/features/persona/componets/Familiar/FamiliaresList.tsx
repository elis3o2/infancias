import type { FamiliarCreate } from "../../types"
import { Stack, Divider, Box } from "@mui/material"
import { ListData } from "@/common/components/ListData"

type Props = {
  familiares: FamiliarCreate[]
  onEliminar?: (n: number) => void
}

export const FamiliaresList = ({ familiares, onEliminar }: Props) => {
  return (
        <Stack spacing={2}>
        {familiares.map((familiar, index) => (
            <Box key={index}>
            <ListData
              {...(familiar.dni != null && { dni: familiar.dni })}
              {...(familiar.nombre != null && { nombre: familiar.nombre })}
              {...(familiar.apellido != null && { apellido: familiar.apellido })}
              {...(familiar.sexo != "" && { sexo: familiar.sexo })}
              {...(familiar.domicilio?.nombre != null && { domicilio: familiar.domicilio.nombre})}
              {...(familiar.telefono != null && { telefono: familiar.telefono })}
              {...(onEliminar != null && {onEditar: () => onEliminar(index) })}
              texto="Eliminar"
            />
            {index < familiares.length - 1 && (
                <Divider sx={{ mt: 2 }} />
            )}
            </Box>
        ))}
        </Stack>
  )
}
import type { HermanoCreate } from "../../types"
import { Card, CardContent, Stack, Divider, Box } from "@mui/material"
import { ListData } from "@/common/components/ListData"

type Props = {
  hermanos: HermanoCreate[]
  onEliminar?: (n: number) => void
}

export const HermanosCard = ({ hermanos, onEliminar }: Props) => {
  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={2}>
        {hermanos.map((hermano, index) => (
            <Box key={index}>
            <ListData
                dni={hermano.dni}
                nombre={hermano.nombre}
                apellido={hermano.apellido }
                {...(hermano.sexo != "" && { sexo: hermano.sexo })}
                {...(onEliminar != null && {onEditar: () => onEliminar(index) })}
            />
            {index < hermanos.length - 1 && (
                <Divider sx={{ mt: 2 }} />
            )}
            </Box>
        ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
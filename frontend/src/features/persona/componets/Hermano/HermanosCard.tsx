import type { Hermano } from "../../types"
import { Stack, Divider, Box, Card, CardHeader, CardContent } from "@mui/material"
import { ListData } from "@/common/components/ListData"

type Props = {
  hermanos: Hermano[]
}

export const HermanosCard = ({ hermanos }: Props) => {
  return (
    <Card sx={{minWidth: 1028}}>
    <CardHeader
          title="Hermanos"
          titleTypographyProps={{ variant: 'h6', fontWeight: 300 }}
        />
      <CardContent>
    <Stack spacing={2}>
      {hermanos.map((hermano, index) => (
          <Box key={index}>
          <ListData
              dni={hermano.dni}
              nombre={hermano.nombre}
              apellido={hermano.apellido }
              fecha_nacimiento={hermano.fecha_nacimiento}
              sexo={hermano.sexo}
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
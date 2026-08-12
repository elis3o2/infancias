import type { Hermano } from "../../types"
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  CardActions,
  Button, 
  Divider
} from "@mui/material"
import { AdolescenteSimpleCard } from "../Adolescente/AdolescenteSimpleCard"

type Props = {
  hermanos: Hermano[]
  onEliminar?: (n: number) => void
}

export const HermanoValidadoCard = ({ hermanos, onEliminar }: Props) => {
  
    return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Hermanos
        </Typography>
        <Stack spacing={2}>

        {hermanos.map((hermano, index) => (
            <Box key={hermano.id ?? index}>
              <Stack direction="row" spacing={2} key={hermano.dni ?? index}>
                <Box sx={{ flex: 1 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      Datos del hermano
                    </Typography>

                  </Stack>
                    <AdolescenteSimpleCard
                      nombre={hermano.nombre}
                      apellido={hermano.apellido}
                      sexo={hermano.sexo}
                      dni={hermano.dni}
                      fecha_nacimiento={hermano.fecha_nacimiento}
                    />
                </Box>
              </Stack>
                {onEliminar && 
              <CardActions>
                <Button onClick={() => onEliminar(index)}>Eliminar</Button>
              </CardActions>}

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
import type {  Institucion } from "../../types"
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material"

import { ListData } from "@/common/components/ListData";

type Props = {
  institucion: Institucion
  onEditar?: () => void
}


export const InstitucionCard = ({ institucion, onEditar }: Props) => {

  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <Typography variant="h6" lineHeight={1.2}>
               Datos de la institucion solicitante
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={3}>
          <Box sx={{ flex: 1 }}>
            <ListData
              institucion_nombre={institucion.nombre}
              institucion_domicilio={institucion.domicilio.nombre}
              institucion_tipo={institucion.tipo.nombre}
              onEditar={onEditar}
            />
          </Box>
        </Stack>
      </CardContent>

    </Card>
  )
}
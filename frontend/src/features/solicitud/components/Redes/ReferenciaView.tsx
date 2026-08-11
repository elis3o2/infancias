import type { Referencia } from "@/features/domicilio/types"
import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Typography,
  Button,
} from "@mui/material"

type Props = {
  referencia: Referencia
  onEliminar: () => void
}



export const ReferenciaView = ({ referencia, onEliminar }: Props) => {
  return (
    <Card sx={{ minWidth: 1028 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6">
            {referencia.nombre}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions>
        <Button color="error" onClick={onEliminar} fullWidth>
          Eliminar
        </Button>
      </CardActions>
    </Card>
  )
}

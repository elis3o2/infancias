import type { Familiar } from "../../types"
import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Button,
  Typography,
} from "@mui/material"

type Props = {
  familiar: Familiar
  onEliminar: () => void
}

export const FamiliarView = ({ familiar, onEliminar }: Props) => {
  return (
    <Card  sx={{ minWidth: 1028 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {familiar.nombre} {familiar.apellido}
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            Vínculo: {familiar.vinculo?.nombre}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Teléfono: {familiar.telefono}
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
import type { MotivoSolicitud, PrioridadSolicitud} from "../../types"
import type { Setter } from "@/common/types"
import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Button,
  Typography,
} from "@mui/material"

type Props = {
  prioridad: PrioridadSolicitud
  motivo: MotivoSolicitud
  descripcion: string
  setFinishSolicitudSection: Setter<boolean>
}

export const SolicitudView = ({ prioridad, motivo, descripcion, setFinishSolicitudSection}: Props) => {
  return (
    <Card sx={{ minWidth: 1028 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Datos de la solicitud
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Descripción: {descripcion}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Prioridad: {prioridad.nombre}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Motivo: {motivo.nombre}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions>
        <Button onClick={() => setFinishSolicitudSection(false)} fullWidth>
          Editar
        </Button>
      </CardActions>
    </Card>
  )
}
import type { Hermano } from "../../types"
import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Box,
  Typography,
  Divider,
  Button,
} from "@mui/material"

type Props = {
  hermano: Hermano
  onEliminar: () => void
}

const Campo = ({ label, valor }: { label: string; valor: string }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500}>
      {valor}
    </Typography>
  </Box>
)



export const HermanoView = ({ hermano, onEliminar }: Props) => {
  const sexoLabel = hermano.sexo === "M" ? "Masculino" : "Femenino"

  return (
    <Card sx={{ minWidth: 1028 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6">
            {hermano.nombre} {hermano.apellido}
          </Typography>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={1.5}>
            <Campo label="DNI" valor={hermano.dni} />
            <Campo label="Sexo" valor={sexoLabel} />
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

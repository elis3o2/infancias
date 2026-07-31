import type { Solicitante } from "../../types"
import { Card, CardContent, CardActions, Stack, Box, Typography, Divider, Button } from "@mui/material"

type Props = {
  solicitante: Solicitante
  onEditar: () => void
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

export const SolicitanteView = ({ solicitante, onEditar }: Props) => {
  const sexoLabel = solicitante.sexo === "M" ? "Masculino" : "Femenino"

  return (
    <Card  sx={{ minWidth: 1028 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {solicitante.nombre} {solicitante.apellido}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={1.5}>
          <Campo label="DNI" valor={solicitante.dni} />
          <Campo label="Sexo" valor={sexoLabel} />
          <Campo label="Teléfono" valor={solicitante.telefono} />
          <Campo label="Correo" valor={solicitante.correo} />
        </Stack>
      </CardContent>
      <CardActions>
        <Button onClick={onEditar}>Editar</Button>
      </CardActions>
    </Card>
  )
}
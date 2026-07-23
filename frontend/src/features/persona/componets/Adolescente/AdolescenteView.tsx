import type { Adolescente } from "../../types"
import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Box,
  Typography,
  Divider,
  Button,
  Chip,
} from "@mui/material"

type Props = {
  adolescente: Adolescente
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

const formatFecha = (fecha: string) => {
  const [anio, mes, dia] = fecha.split("-")
  if (!anio || !mes || !dia) return fecha
  return `${dia}/${mes}/${anio}`
}

export const AdolescenteView = ({ adolescente, onEditar }: Props) => {
  const sexoLabel = adolescente.sexo === "M" ? "Masculino" : "Femenino"

  return (
    <Card sx={{ maxWidth: 500 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6">
            {adolescente.nombre} {adolescente.apellido}
          </Typography>
          <Chip
            size="small"
            label={adolescente.escolarizado ? "Escolarizado" : "No escolarizado"}
            color={adolescente.escolarizado ? "success" : "default"}
          />
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={1.5}>
            <Campo label="DNI" valor={adolescente.dni} />
            <Campo label="Sexo" valor={sexoLabel} />
            <Campo label="Fecha de nacimiento" valor={formatFecha(adolescente.fecha_nacimiento)} />
            <Campo label="Domicilio" valor={adolescente.domicilio.nombre} />
        </Stack>
      </CardContent>
      <CardActions>
        <Button onClick={onEditar}>Editar</Button>
      </CardActions>
    </Card>
  )
}
import { Box, Card, CardContent, Stack, Typography, Chip, Button } from "@mui/material"
import type { MotivoSolicitud, PrioridadSolicitud } from "../../types"

type Props = {
  motivo: MotivoSolicitud
  prioridad: PrioridadSolicitud
  descripcion: string
  onEditar?: () => void
}

const PRIORIDAD_COLOR: Record<string, "error" | "warning" | "success" | "default"> = {
  Urgente: "error",
  Prioritaria: "warning",
  Preventiva: "success",
}

export const SolicitudCard = ({ motivo, prioridad, descripcion, onEditar }: Props) => {
  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row"  sx={{alignItems:"center", justifyContent:"space-between"}}>
            <Stack direction="row" spacing={1} sx={{alignItems:"center"}}>
              <Typography variant="h6">Descripción</Typography>
              {motivo && <Chip label={motivo.nombre} size="small" variant="outlined" />}
              {prioridad && (
                <Chip
                  label={prioridad.nombre}
                  size="small"
                  color={PRIORIDAD_COLOR[prioridad.nombre] ?? "default"}
                />
              )}
            </Stack>
            {onEditar && (
              <Button size="small" onClick={onEditar}>
                Editar
              </Button>
            )}
          </Stack>

          <Box
            sx={{
              bgcolor: "action.hover",
              borderRadius: 2,
              px: 2,
              py: 2,
            }}
          >
            <Typography
              variant="body1"
              sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {descripcion || "Sin descripción"}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
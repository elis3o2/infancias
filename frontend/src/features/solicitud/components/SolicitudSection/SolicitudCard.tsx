import { Box, Stack, Typography, Chip, Button } from "@mui/material";
import type { MotivoSolicitud } from "../../types";

type Props = {
  motivo: MotivoSolicitud;
  descripcion: string;
  onEditar?: () => void;
};



export const SolicitudCard = ({ motivo, descripcion, onEditar }: Props) => {
  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center" }}
        >
          {motivo && (
            <Chip
              label={motivo.nombre}
              size="small"
              variant="outlined"
            />
          )}

        </Stack>

        {onEditar && (
          <Button
            size="small"
            onClick={onEditar}
          >
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
          sx={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {descripcion || "Sin descripción"}
        </Typography>
      </Box>
    </Stack>
  )
}

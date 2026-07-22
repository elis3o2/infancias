import { Paper, Typography, Divider, Chip, Stack, Button, Box} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import type { Escolaridad } from "@/features/persona/types";
import type { Setter } from "@/common/types";

type Props = {
  escolarizado: boolean;
  escolaridadSeleccionada: Escolaridad | null;
  escuela: string;
  setFinishEscolaridad: Setter<boolean>
};

export const EscolaridadResumen = ({escolarizado, escolaridadSeleccionada, escuela, setFinishEscolaridad}: Props) => {
  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{ width: '100%', minWidth: 600, borderRadius: 3, overflow: "hidden" }} 
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ px: 3, py: 2, bgcolor: "info.50" }}
      >
        <SchoolIcon sx={{ color: "info.main" }} />

        <Typography variant="subtitle1" fontWeight={600} color="info.dark">
          Escolaridad
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={() => setFinishEscolaridad(false)}
        >
          Editar
        </Button>
      </Stack>

      <Divider />

      <Stack spacing={0} divider={<Divider flexItem />}>
        {/* Escolarizado */}
        <Stack
          direction="row"
          alignItems="center"
          sx={{ px: 3, py: 1.75, gap: 2 }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            ¿Actualmente escolarizado/a?
          </Typography>
          <Chip
            size="small"
            icon={
              escolarizado ? (
                <CheckCircleIcon fontSize="small" />
              ) : (
                <CancelIcon fontSize="small" />
              )
            }
            label={escolarizado ? "Sí" : "No"}
            color={escolarizado ? "success" : "default"}
            variant="outlined"
          />
        </Stack>

        {/* Nivel alcanzado */}
        <Stack
          direction="row"
          alignItems="center"
          sx={{ px: 3, py: 1.75, gap: 2 }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            Nivel de escolaridad alcanzado:
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            {escolaridadSeleccionada?.nombre ?? "—"}
          </Typography>
        </Stack>

        {/* Escuela */}
        <Stack
          direction="row"
          alignItems="center"
          sx={{ px: 3, py: 1.75, gap: 2 }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            Institución educativa:
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ textAlign: "right" }}>
            {escuela || "—"}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
};
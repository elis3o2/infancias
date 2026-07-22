import { Box, Avatar, Typography, Chip, Button } from "@mui/material";
import type { Ciudadano } from "@/features/persona/types";
import type { Setter } from "@/common/types";

type Props = {
  ciudadano: Ciudadano;
  setCiudadano: Setter<Ciudadano | null>;
  setFinishPersona: Setter<boolean>
};

export const PersonaCard = ({ ciudadano, setCiudadano, setFinishPersona }: Props) => {
  const getInitials = (nombre: string, apellido: string) =>
    `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();

  return (
    <Box
      sx={{
        background: "linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%)",
        px: 3,
        py: 2.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Lado izquierdo: avatar + datos */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar
          sx={{
            bgcolor: "primary.main",
            width: 48,
            height: 48,
            fontSize: "1.1rem",
            fontWeight: 700,
            boxShadow: "0 0 16px rgba(59,130,246,0.3)",
          }}
        >
          {getInitials(ciudadano.nombre, ciudadano.apellido)}
        </Avatar>

        <Box>
          <Typography
            variant="h6"
            fontWeight={700}
            color="text.primary"
            lineHeight={1.2}
          >
            {ciudadano.nombre} {ciudadano.apellido}
          </Typography>

          <Chip
            label={`DNI ${ciudadano.nroDocumento}`}
            size="small"
            sx={{
              mt: 0.5,
              bgcolor: "rgba(59,130,246,0.1)",
              color: "primary.main",
              fontSize: "0.7rem",
              height: 20,
            }}
          />
        </Box>
      </Box>

      {/* Lado derecho: botón */}
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        onClick={() => {setCiudadano(null); setFinishPersona(false)}}
      >
        Limpiar
      </Button>
    </Box>
  );
};
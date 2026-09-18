import { Stack, Box, Typography, TextField, InputAdornment } from "@mui/material"
import PhoneIcon from "@mui/icons-material/Phone"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"

type Props = {
  telefono: string
  setTelefono: (telefono: string) => void
}
export const TelefonoComponent = ({ telefono, setTelefono }: Props) => {
  const iconoEstado =
    telefono.length === 0
      ? null
      : telefono.length === 10
      ? <CheckCircleIcon fontSize="small" color="success" />
      : <CancelIcon fontSize="small" color="error" />

  return (
    <Stack direction="row" sx={{ spacing: 1.5, alignItems:"flex-start"}}>
      <Box
        sx={{
          color: "primary.main",
          mt: "2px",
          flexShrink: 0,
          opacity: 0.7,
        }}
      >
        <PhoneIcon fontSize="small" />
      </Box>

      <Box sx={{ flex: 1 }}>
        <Typography
          variant="caption"
          sx={{display: "block",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "text.disabled"
          }}
        >
          Teléfono
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="341XXXXXXX"
          value={telefono}
          onChange={(e) => {
            const valor = e.target.value.replace(/\D/g, "")
            setTelefono(valor)
          }}
          slotProps={{
            input: {
              endAdornment: iconoEstado ? (
                <InputAdornment position="end">
                  {iconoEstado}
                </InputAdornment>
              ) : null,
            },
          }}
        />
      </Box>
    </Stack>
  )
}

import { Button, Chip, Stack } from "@mui/material"

type Estado = "confirmado" | "rechazado" | null

type AccionesProps = {
  estado: Estado
  onConfirmar: () => void
  onRechazar: () => void
  onLimpiar: () => void
  confirmarLabel?: string
}

export const AccionesValidacion = ({
  estado,
  onConfirmar,
  onRechazar,
  onLimpiar,
  confirmarLabel = "Confirmar datos",
}: AccionesProps) => {
  if (estado !== null) {
    return (
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "stretch", sm: "center" } }}
      >
        <Chip
          color={estado === "confirmado" ? "success" : "error"}
          label={estado === "confirmado" ? "Datos confirmados" : "Datos rechazados"}
          size="small"
          sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
        />
        <Button size="small" onClick={onLimpiar} sx={{ width: { xs: "100%", sm: "auto" } }}>
          Revisar nuevamente
        </Button>
      </Stack>
    )
  }

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <Button variant="contained" size="small" onClick={onConfirmar} sx={{ width: { xs: "100%", sm: "auto" } }}>
        {confirmarLabel}
      </Button>
      <Button variant="outlined" color="error" size="small" onClick={onRechazar} sx={{ width: { xs: "100%", sm: "auto" } }}>
        Rechazar datos
      </Button>
    </Stack>
  )
}

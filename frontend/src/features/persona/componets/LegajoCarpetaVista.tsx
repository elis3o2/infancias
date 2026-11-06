import { Box, Typography } from "@mui/material"

type Props = { legajo?: number | null; carpeta?: number | null }

export function LegajoCarpetaVista({ legajo, carpeta }: Props) {
  return <Box component="dl" aria-label="Legajo y carpeta de solo lectura"
    sx={{ display: "flex", flexWrap: "wrap", gap: 2, m: 0 }}>
    {([["Legajo", legajo], ["Carpeta", carpeta]] as const).map(([etiqueta, numero]) => (
      <Box key={etiqueta} sx={{ minWidth: 100, overflowWrap: "anywhere" }}>
        <Typography component="dt" variant="caption" color="text.secondary">{etiqueta}</Typography>
        <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 700 }}>{numero ?? "Sin asignar"}</Typography>
      </Box>
    ))}
  </Box>
}

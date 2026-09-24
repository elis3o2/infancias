import { Box, Typography } from "@mui/material"
import { indicadoresSalud, obtenerDatosSalud } from "../salud"
import type { SaludConsulta } from "../salud"

export function DatosSalud({ persona }: { persona: SaludConsulta }) {
  const salud = obtenerDatosSalud(persona)
  const campos = [
    ["Historia clínica individual (HC)", salud.hc ?? "Sin informar"],
    ["Historia clínica familiar (HCF)", salud.hcf ?? "Sin informar"],
    ...indicadoresSalud.map(([campo, etiqueta]) => [
      etiqueta, salud[campo] === undefined ? "Sin informar" : salud[campo] ? "Sí" : "No",
    ]),
  ]
  return (
    <Box component="section" aria-label="Datos de salud de solo lectura">
      <Typography variant="subtitle2">Datos de salud</Typography>
      <Typography variant="caption" color="text.secondary">Datos consultados · Solo lectura</Typography>
      <Box component="dl" sx={{ display: "grid", m: 0, mt: 1,
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 1 }}>
        {campos.map(([etiqueta, valor]) => (
          <Box key={etiqueta} sx={{ p: 1.5, borderRadius: 2, bgcolor: "action.hover", minWidth: 0 }}>
            <Typography component="dt" variant="caption" color="text.secondary">{etiqueta}</Typography>
            <Typography component="dd" sx={{ m: 0, fontWeight: 600, overflowWrap: "anywhere" }}>{valor}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

import { Box, MenuItem, TextField, Typography } from "@mui/material"
import type { SaludDatosInput } from "../../../types"

type Props = { salud: SaludDatosInput; onChange: (salud: SaludDatosInput) => void }
type CampoSalud = Exclude<keyof SaludDatosInput, "hcf">
const campos: [CampoSalud, string][] = [
  ["discapacidades", "Discapacidades"],
  ["consumos_problematicos", "Consumos problemáticos"],
  ["intentos_de_suicidio", "Intentos de suicidio"],
  ["problemas_socioambientales", "Problemas socioambientales"],
  ["violencias", "Violencias"],
]

export function SaludValidacionForm({ salud, onChange }: Props) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Datos de salud</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
        <TextField label="Historia clínica familiar" size="small" type="number" value={salud.hcf ?? ""}
          slotProps={{ htmlInput: { min: 1 } }} onChange={(event) => {
            const siguiente = { ...salud }
            const valor = event.target.value
            if (!valor) delete siguiente.hcf
            else if (Number.isInteger(Number(valor)) && Number(valor) > 0) siguiente.hcf = Number(valor)
            onChange(siguiente)
          }} />
        {campos.map(([campo, etiqueta]) => (
          <TextField key={campo} select label={etiqueta} size="small"
            value={salud[campo] === undefined ? "" : salud[campo] ? "si" : "no"}
            onChange={(event) => {
              const siguiente = { ...salud }
              if (!event.target.value) delete siguiente[campo]
              else siguiente[campo] = event.target.value === "si"
              onChange(siguiente)
            }}>
            <MenuItem value="">Sin informar</MenuItem>
            <MenuItem value="si">Sí</MenuItem>
            <MenuItem value="no">No</MenuItem>
          </TextField>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary">Los campos sin informar conservan los datos ya registrados.</Typography>
    </Box>
  )
}

import { FormControlLabel, Stack, Switch, TextField } from "@mui/material"

type Props = {
  tieneLegajo: boolean
  setTieneLegajo: (valor: boolean) => void
  legajo: number | null
  setLegajo: (valor: number | null) => void
  carpeta: number | null
  setCarpeta: (valor: number | null) => void
}

const actualizarNumero = (
  valor: string,
  actualizar: (numero: number | null) => void,
) => {
  if (!/^\d*$/.test(valor)) return
  actualizar(valor === "" ? null : Number(valor))
}

/**
 * Legajo y carpeta son una sola decisión operativa: existen juntos o no se
 * cargan. Las letras son un detalle de compatibilidad del servidor y no se
 * muestran ni se envían desde la interfaz.
 */
export const LegajoForm = ({
  tieneLegajo,
  setTieneLegajo,
  legajo,
  setLegajo,
  carpeta,
  setCarpeta,
}: Props) => {
  return (
    <Stack spacing={1.5}>
      <FormControlLabel
        control={
          <Switch
            checked={tieneLegajo}
            onChange={(event) => setTieneLegajo(event.target.checked)}
          />
        }
        label="¿Tiene legajo y carpeta?"
      />

      {tieneLegajo && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            label="Número de legajo"
            type="text"
            slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*" } }}
            value={legajo ?? ""}
            onChange={(event) => actualizarNumero(event.target.value, setLegajo)}
          />
          <TextField
            fullWidth
            label="Número de carpeta"
            type="text"
            slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*" } }}
            value={carpeta ?? ""}
            onChange={(event) => actualizarNumero(event.target.value, setCarpeta)}
          />
        </Stack>
      )}
    </Stack>
  )
}

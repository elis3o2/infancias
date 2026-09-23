import { useState } from "react"
import { Alert, Button, Checkbox, FormControlLabel, FormGroup, Stack, Typography } from "@mui/material"
import { InstitucionInicial } from "@/features/domicilio/types"
import { InstitucionForm } from "@/features/domicilio/components/Institucion/InstitucionForm"
import { InstitucionList } from "@/features/domicilio/components/Institucion/InstitucionList"
import { crearIdTemporal, nombreAdolescente, type AdolescenteFormulario, type ReferenciaFormulario } from "./formTypes"

type Props = {
  adolescentes: AdolescenteFormulario[]
  actual?: { institucion: ReferenciaFormulario; adolescentes: string[] }
  onGuardar: (institucion: ReferenciaFormulario, seleccionados: string[]) => void
  onCancelar: () => void
}

export function ReferenciasEditor({ adolescentes, actual, onGuardar, onCancelar }: Props) {
  const [institucion, setInstitucion] = useState<ReferenciaFormulario>(actual?.institucion ?? InstitucionInicial)
  const [confirmada, setConfirmada] = useState(Boolean(actual))
  const [seleccionados, setSeleccionados] = useState(actual?.adolescentes ?? [])
  return <Stack spacing={2}>
    {confirmada ? <InstitucionList institucion={institucion} onEditar={() => setConfirmada(false)} /> :
      <InstitucionForm institucion={institucion} setInstitucion={setInstitucion}
        onGuardar={() => setConfirmada(true)} />}
    <Typography variant="subtitle2">Adolescentes vinculados a esta institución</Typography>
    <FormGroup>
      {adolescentes.map((adolescente) => <FormControlLabel key={adolescente.id_temp}
        label={nombreAdolescente(adolescente)} control={<Checkbox
          checked={seleccionados.includes(adolescente.id_temp)}
          onChange={(_, checked) => setSeleccionados((ids) => checked
            ? [...ids, adolescente.id_temp] : ids.filter((id) => id !== adolescente.id_temp))} />} />)}
    </FormGroup>
    {!seleccionados.length && <Alert severity="info">Seleccioná uno o más adolescentes.</Alert>}
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <Button variant="contained" disabled={!confirmada || !seleccionados.length}
        onClick={() => onGuardar({ ...institucion,
          id_temp: institucion.id_temp ?? crearIdTemporal().replace("adolescente-", "referencia-"),
        }, seleccionados)}>Guardar referencia y vínculos</Button>
      <Button onClick={onCancelar}>Cancelar referencia</Button>
    </Stack>
  </Stack>
}

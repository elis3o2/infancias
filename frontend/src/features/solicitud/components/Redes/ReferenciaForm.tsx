import type { Setter } from "@/common/types"
import type { Referencia } from "@/features/domicilio/types"
import { useEffect, useState } from "react"
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  type SelectChangeEvent,
} from "@mui/material"

type Props = {
  referenciaSeleccionada: Referencia | null
  setReferenciaSeleccionada: Setter<Referencia | null>
  setFinishReferencia: Setter<boolean>
  api: () => Promise<Referencia[]>
  nombre: string
}

export const ReferenciaForm = ({ referenciaSeleccionada, setReferenciaSeleccionada,setFinishReferencia, api, nombre}: Props) => {
  const [referencias, setReferencias] = useState<Referencia[]>([])

  useEffect(() => {
    api().then(setReferencias)
  }, [])

  const handleChange = (event: SelectChangeEvent) => {
    const seleccionada = referencias.find((e) => e.id === Number(event.target.value)) ?? null
    setReferenciaSeleccionada(seleccionada)
  }

  return (
    <FormControl fullWidth>
      <InputLabel id="referencia-label">{nombre}</InputLabel>
      <Select
        labelId="referencia-label"
        label="Referencia"
        value={referenciaSeleccionada ? String(referenciaSeleccionada.id) : ""}
        onChange={handleChange}
      >
        {referencias.map((referencia) => (
          <MenuItem key={referencia.id} value={referencia.id}>
            {referencia.nombre}
          </MenuItem>
        ))}
      </Select>
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        disabled={!referenciaSeleccionada}
        onClick={() => setFinishReferencia(true)}
      >
        Confirmar
  </Button>
    </FormControl>
  )
}
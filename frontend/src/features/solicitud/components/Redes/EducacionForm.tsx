import type { Setter } from "@/common/types"
import { getInstitucionEducacion } from "@/features/domicilio/api"
import type { Institucion } from "@/features/domicilio/types"
import { useEffect, useState } from "react"
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material"

type Props = {
  escuelaSeleccionada: Institucion | null
  setEscuelaSeleccionada: Setter<Institucion | null>
  setFinishEducacion: Setter<boolean>
}

export const EducacionForm = ({
  escuelaSeleccionada,
  setEscuelaSeleccionada,
  setFinishEducacion,
}: Props) => {
  const [escuelas, setEscuelas] = useState<Institucion[]>([])

  useEffect(() => {
    getInstitucionEducacion().then(setEscuelas)
  }, [])

  const handleChange = (event: SelectChangeEvent) => {
    const seleccionada = escuelas.find((e) => e.id === Number(event.target.value)) ?? null
    setEscuelaSeleccionada(seleccionada)
  }

  return (
    <FormControl fullWidth sx={{minWidth: 1028}}>
      <InputLabel id="educacion-label">Educación</InputLabel>
      <Select
        labelId="educacion-label"
        label="Educación"
        value={escuelaSeleccionada ? String(escuelaSeleccionada.id) : ""}
        onChange={handleChange}
      >
        {escuelas.map((escuela) => (
          <MenuItem key={escuela.id} value={escuela.id}>
            {escuela.nombre}
          </MenuItem>
        ))}
      </Select>

      <Button
        variant="contained"
        sx={{ mt: 2 }}
        disabled={!escuelaSeleccionada}
        onClick={() => setFinishEducacion(true)}
      >
        Confirmar
      </Button>
    </FormControl>
  )
}
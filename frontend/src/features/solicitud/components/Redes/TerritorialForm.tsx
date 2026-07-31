import type { Setter } from "@/common/types"
import { getInstitucionTerritorial } from "@/features/domicilio/api"
import type { Institucion } from "@/features/domicilio/types"
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
  territorioSeleccionada: Institucion | null
  setTerritorialSeleccionada: Setter<Institucion | null>
  setFinishTerritorial: Setter<boolean>
}

export const TeritorialForm = ({ territorioSeleccionada, setTerritorialSeleccionada,setFinishTerritorial}: Props) => {
  const [territorios, setTerritorios] = useState<Institucion[]>([])

  useEffect(() => {
    getInstitucionTerritorial().then(setTerritorios)
  }, [])

  const handleChange = (event: SelectChangeEvent) => {
    const seleccionada = territorios.find((e) => e.id === Number(event.target.value)) ?? null
    setTerritorialSeleccionada(seleccionada)
  }

  return (
    <FormControl fullWidth>
      <InputLabel id="territorial-label">Territorial</InputLabel>
      <Select
        labelId="territorial-label"
        label="Territorial"
        value={territorioSeleccionada ? String(territorioSeleccionada.id) : ""}
        onChange={handleChange}
      >
        {territorios.map((territorio) => (
          <MenuItem key={territorio.id} value={territorio.id}>
            {territorio.nombre}
          </MenuItem>
        ))}
      </Select>
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        disabled={!territorioSeleccionada}
        onClick={() => setFinishTerritorial(true)}
      >
        Confirmar
  </Button>
    </FormControl>
  )
}
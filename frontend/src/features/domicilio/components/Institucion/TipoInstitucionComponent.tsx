import { useEffect, useState } from "react"
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material"
import type { TipoInstitucion } from "../../types"
import { getTipoInstitucionAll } from "../../api"

type Props = {
  tipoSeleccionado: TipoInstitucion | null
  setTipoSeleccionado: (tipo: TipoInstitucion | null) => void
}

export const TipoInstitucionComponent = ({ tipoSeleccionado, setTipoSeleccionado }: Props) => {
  const [tipos, setTipos] = useState<TipoInstitucion[]>([])

  useEffect(() => {
    getTipoInstitucionAll().then(setTipos)
  }, [])

  const handleChange = (id: number) => {
    const tipo = tipos.find((t) => t.id === id) ?? null
    setTipoSeleccionado(tipo)
  }

  return (
    <FormControl fullWidth>
      <InputLabel id="tipo-institucion-label">Tipo de institución</InputLabel>
      <Select
        labelId="tipo-institucion-label"
        label="Tipo de institución"
        value={tipoSeleccionado?.id ?? ""}
        onChange={(e) => handleChange(Number(e.target.value))}
      >
        {tipos.map((tipo) => (
          <MenuItem key={tipo.id} value={tipo.id}>
            {tipo.nombre}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

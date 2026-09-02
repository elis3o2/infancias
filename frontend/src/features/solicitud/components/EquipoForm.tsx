import { useEffect, useState } from "react"
import { FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from "@mui/material"

import { getEquipos } from "../api"
import type { Equipo } from "@/features/persona/types"

type Props = {
  equipoId: number | null
  onChange: (equipoId: number) => void
}

export default function EquipoSelect({ equipoId, onChange }: Props) {

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarEquipos = async () => {
      try {
        const data = await getEquipos()
        setEquipos(data)
      } finally {
        setCargando(false)
      }
    }

    cargarEquipos()
  }, [])

  const handleChange = (event: SelectChangeEvent<number>) => {
    onChange(Number(event.target.value))
  }

  return (
    <FormControl fullWidth disabled={cargando}>
      <InputLabel id="equipo-select-label">
        Equipo
      </InputLabel>

      <Select
        labelId="equipo-select-label"
        value={equipoId ?? ""}
        label="Equipo"
        onChange={handleChange}
      >
        {equipos.map((equipo) => (
          <MenuItem
            key={equipo.id}
            value={equipo.id}
          >
            {equipo.nombre}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
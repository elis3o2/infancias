import type { Setter } from '@/common/types'
import type { Escolaridad } from '@/features/persona/types'
import {FormControl, InputLabel, Select, MenuItem} from '@mui/material'

type Props = {
    escolaridadSeleccionada: Escolaridad | null
    setEscolaridadSeleccionada: Setter<Escolaridad | null>
    escolaridades: Escolaridad[]
}

export const EscolaridadForm = ({escolaridadSeleccionada, setEscolaridadSeleccionada, escolaridades}: Props) => {
    const handleEscolaridad = (id: number) => {
      const encontrada = escolaridades.find((op) => op.id === id) ?? null;
      setEscolaridadSeleccionada(encontrada); 
    };
    
    return (
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="escolaridad-label">
          Nivel de escolaridad alcanzado
        </InputLabel>
        <Select
          labelId="escolaridad-label"
          label="Nivel de escolaridad alcanzado"
          value={escolaridadSeleccionada?.id ?? ""} 
          onChange={(e) => handleEscolaridad(e.target.value as number)}  
        >
          {escolaridades.map((op) => (
            <MenuItem key={op.id} value={op.id}>
              {op.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )
}
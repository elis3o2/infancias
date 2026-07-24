import { useEffect, useState } from 'react'
import { FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material'
import type { Setter } from "@/common/types"
import type { PrioridadSolicitud } from "../types"
import { getPrioridades } from '../api'

type Props = {
    prioridadSeleccionada: PrioridadSolicitud
    setPrioridadSeleccionada: Setter<PrioridadSolicitud>
}


export const PrioridadForm = ({prioridadSeleccionada, setPrioridadSeleccionada}: Props) => { 
    const [prioridades, setPrioridades] = useState<PrioridadSolicitud[]>([])
    const [cargando, setCargando] = useState(true)


    useEffect(() => {
        let activo = true
    
        const cargarOpciones = async () => {
          try {
            const [dataPrioridades] = await Promise.all([
              getPrioridades(),
            ])
            if (activo) {
              setPrioridades(dataPrioridades)
            }
          } finally {
            if (activo) {
              setCargando(false)
            }
          }
        }
    
        cargarOpciones()
    
        return () => {
          activo = false
        }
      }, [])

    if (cargando) {
        return <CircularProgress size={24} />
    }
      
    return (
    <FormControl fullWidth required>
        <InputLabel id="prioridad-label">Prioridad</InputLabel>
        <Select
            labelId="prioridad-label"
            label="Prioridad"
            value={prioridadSeleccionada?.id ?? ""}
            onChange={(e) => {
            const idSeleccionado = Number(e.target.value)
            const prioridad = prioridades.find((p) => p.id === idSeleccionado) ?? null
            setPrioridadSeleccionada(prioridad)
            }}
        >
            {prioridades.map((prioridad) => (
            <MenuItem key={prioridad.id} value={prioridad.id}>
                {prioridad.nombre}
            </MenuItem>
            ))}
        </Select>
    </FormControl>
    )
} 
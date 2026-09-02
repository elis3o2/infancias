import { useEffect, useState } from 'react'
import { FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material'
import type { Setter } from "@/common/types"
import type { MotivoSolicitud } from "../types"
import { getMotivos } from '../api'

type Props = {
    motivoSeleccionado: MotivoSolicitud | null
    setMotivoSeleccionado: Setter<MotivoSolicitud | null>
}


export const MotivodForm = ({motivoSeleccionado, setMotivoSeleccionado}: Props) => { 
    const [motivos, setMotivos] = useState<MotivoSolicitud[]>([])
    const [cargando, setCargando] = useState(true)


    useEffect(() => {
      let activo = true
  
      const cargarOpciones = async () => {
        try {
          const [dataMotivodes] = await Promise.all([
            getMotivos(),
          ])
          if (activo) {
            setMotivos(dataMotivodes)
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
      <InputLabel id="motivo-label">Motivo</InputLabel>
      <Select
        labelId="motivo-label"
        label="Motivo"
        value={motivoSeleccionado?.id ?? ""}
        onChange={(e) => {
          const idSeleccionado = Number(e.target.value)
          const motivo = motivos.find((m) => m.id === idSeleccionado) ?? null
          setMotivoSeleccionado(motivo)
        }}
      >
        {motivos.map((motivo) => (
        <MenuItem key={motivo.id} value={motivo.id}>
            {motivo.nombre}
        </MenuItem>
        ))}
      </Select>
    </FormControl>
    )
} 
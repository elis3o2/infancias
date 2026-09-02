import { useEffect, useState } from "react"
import { FormControl, InputLabel, Select, MenuItem, CircularProgress } from "@mui/material"
import { getVinculos } from "../api"
import type { Vinculo } from "../types"
import type { Setter } from "@/common/types"

type Props = {
    vinculoSeleccionado: Vinculo | null
    setVinculoSeleccionado: Setter<Vinculo | null>
}

export const VinculoForm = ({vinculoSeleccionado, setVinculoSeleccionado}: Props) => {
    const [vinculos, setVinculos] = useState<Vinculo[]>([])
    const [cargandoVinculos, setCargandoVinculos] = useState(true)

    useEffect(() => {
    let activo = true

    const cargarVinculos = async () => {
        try {
            const data = await getVinculos()
            if (activo) {
                setVinculos(data)
            }
            } finally {
            if (activo) {
                setCargandoVinculos(false)
            }
        }
    }

    cargarVinculos()

    return () => {
        activo = false
    }
    }, [])

    if (cargandoVinculos){
        return <CircularProgress size={24} />
    }
    return (
    <FormControl fullWidth required>
        <InputLabel id="vinculo-label">Vínculo</InputLabel>
        <Select
        labelId="vinculo-label"
        label="Vínculo"
        value={vinculoSeleccionado?.id ?? ""}
        onChange={(e) => {
            const idSeleccionado = Number(e.target.value)
            const vinculo = vinculos.find((v) => v.id === idSeleccionado) ?? null
            setVinculoSeleccionado(vinculo)
        }}
        >
        {vinculos.map((vinculo) => (
            <MenuItem key={vinculo.id} value={vinculo.id}>
            {vinculo.nombre}
            </MenuItem>
        ))}
        </Select>
    </FormControl>
    )
}
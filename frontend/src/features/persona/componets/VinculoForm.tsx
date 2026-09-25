import { useEffect, useId, useState } from "react"
import { Alert, Button, FormControl, InputLabel, Select, MenuItem, CircularProgress } from "@mui/material"
import { getVinculos, getVinculosAdolescentes } from "../api"
import type { Vinculo } from "../types"

type Props = {
    vinculoSeleccionado: Vinculo | null
    setVinculoSeleccionado: (vinculo: Vinculo | null) => void
    adolescente?: boolean
}

export const VinculoForm = ({vinculoSeleccionado, setVinculoSeleccionado, adolescente = false}: Props) => {
    const labelId = useId()
    const [vinculos, setVinculos] = useState<Vinculo[]>([])
    const [cargandoVinculos, setCargandoVinculos] = useState(true)
    const [error, setError] = useState(false)
    const [intento, setIntento] = useState(0)

    useEffect(() => {
    let activo = true

    const cargarVinculos = async () => {
        setCargandoVinculos(true)
        setError(false)
        try {
            const data = await (adolescente ? getVinculosAdolescentes() : getVinculos())
            if (activo) {
                setVinculos(data)
            }
            } catch {
                if (activo) setError(true)
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
    }, [adolescente, intento])

    if (cargandoVinculos){
        return <CircularProgress size={24} />
    }
    if (error) return <Alert severity="error" action={<Button onClick={() => setIntento(intento + 1)}>Reintentar</Button>}>
        No se pudieron cargar los vínculos.
    </Alert>
    return (
    <FormControl fullWidth required>
        <InputLabel id={labelId}>Vínculo</InputLabel>
        <Select
        labelId={labelId}
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

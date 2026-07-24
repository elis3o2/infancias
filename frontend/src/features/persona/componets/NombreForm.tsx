import { TextField } from '@mui/material'
import type { Setter } from "@/common/types"


type Props = {
    label: string
    value: string
    setNombre: Setter<string>
}

export const NombreForm = ({label, value, setNombre}: Props) => {
    return (
    <TextField
    label={label}
    value={value}
    onChange={(e) => {
        const valor = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ´\s]/g, "")
        setNombre(valor)
    }}
    fullWidth
    />)
}
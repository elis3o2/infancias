import { TextField } from '@mui/material'

type Props = {
    label: string
    value: string
    setNombre: (nombre: string) => void
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
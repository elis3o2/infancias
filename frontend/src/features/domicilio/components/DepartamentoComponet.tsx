import { useEffect, useState } from "react"
import { Autocomplete, TextField } from "@mui/material"
import type { Departamento } from "../types"
import { getDepartamentos } from "../api"

type Props = {
    departamento: Departamento | null
    setDepartamento: (departamento: Departamento | null) => void
    id_provincia: number | null
    disabled?: boolean
    error?: boolean
    helperText?: string
}


export const DepartamentoComponent = ({ departamento, setDepartamento, id_provincia, disabled, error, helperText }: Props) => {

    const [departamentos, setDepartamentos] = useState<Departamento[]>([])
    const [loading, setLoading] = useState(false)


    useEffect(() => {
        if (id_provincia === null) {
            setDepartamentos([])
            return
        }

        let cancelado = false

        const fetchDepartamentos = async () => {
            try {
                setLoading(true)

                const data = await getDepartamentos(id_provincia)

                if (!cancelado) {
                    setDepartamentos(data)
                }
            } catch (error) {
                if (!cancelado) {
                    console.error("Error al obtener departamentos:", error)
                    setDepartamentos([])
                }
            } finally {
                if (!cancelado) {
                    setLoading(false)
                }
            }
        }

        fetchDepartamentos()

        return () => {
            cancelado = true
        }
    }, [id_provincia])

    return (
        <Autocomplete
            options={departamentos}
            value={departamento}
            onChange={(_, value) => {
                setDepartamento(value)
            }}
            getOptionLabel={(option) => option.nombre}
            isOptionEqualToValue={(option, value) =>
                option.id === value.id
            }
            loading={loading}
            disabled={disabled}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Departamento"
                    error={error}
                    helperText={helperText}
                />
            )}
        />
    )
}
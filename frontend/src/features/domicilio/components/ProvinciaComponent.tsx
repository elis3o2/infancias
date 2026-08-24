import { useEffect, useState } from "react"
import { Autocomplete, TextField } from "@mui/material"
import type { Provincia } from "../types"
import { getProvincias } from "../api"


type Props = {
    provincia: Provincia | null
    setProvincia: (provincia: Provincia | null) => void
    disabled?: boolean
    error?: boolean
    helperText?: string
}


export const ProvinciaComponent = ({ provincia, setProvincia, disabled, error, helperText }: Props) => {

    const [provincias, setProvincias] = useState<Provincia[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchProvincias = async () => {
            try {
                setLoading(true)
                const data = await getProvincias()
                setProvincias(data)
            } catch (error) {
                console.error(
                    "Error al obtener provincias:",
                    error
                )
                setProvincias([])
            } finally {
                setLoading(false)
            }
        }
        fetchProvincias()
    }, [])


    return (
        <Autocomplete
            options={provincias}
            value={provincia}
            onChange={(_, value) => {
                setProvincia(value)
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
                    label="Provincia"
                    error={error}
                    helperText={helperText}
                />
            )}
        />
    )
}
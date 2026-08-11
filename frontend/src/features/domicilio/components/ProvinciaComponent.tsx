import { useEffect, useState } from "react"
import { Autocomplete, TextField, CircularProgress } from "@mui/material"
import type { Provincia } from "../types"
import type { Setter } from "@/common/types"
import { getProvincias } from "../api"

type Props = {
  provincia: Provincia | null
  setProvincia: Setter<Provincia | null>
  disabled?: boolean
  error?: boolean
  helperText?: string
}

export const ProvinciaComponent = ({
  provincia,
  setProvincia,
  disabled,
  error,
  helperText,
}: Props) => {
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProvincias = async () => {
      try {
        setLoading(true)
        const data = await getProvincias()
        setProvincias(data)
      } catch (error) {
        console.error("Error al obtener provincias:", error)
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
      onChange={(_, value) => setProvincia(value)}
      getOptionLabel={(option) => option.nombre}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      loading={loading}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Provincia"
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && (
                  <CircularProgress color="inherit" size={20} />
                )}
                {params.InputProps?.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  )
}
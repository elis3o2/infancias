import { useState, useEffect } from "react"
import { Autocomplete, TextField, CircularProgress } from "@mui/material"
import { InstitucionInicial, type Institucion, type TipoInstitucion } from "../../types"
import type { Setter } from "@/common/types"
import { getInstitucionByTipo } from "../../api"

type Props = {
  institucion: Institucion
  setInstitucion: Setter<Institucion>
  tipo: TipoInstitucion
}

export const InstitucionSelectForm = ({ institucion, setInstitucion, tipo }: Props) => {
  const [instituciones, setInstituciones] = useState<Institucion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setInstitucion(InstitucionInicial)

    if (!tipo) {
      setInstituciones([])
      return
    }

    setLoading(true)
    getInstitucionByTipo(tipo.id)
      .then(setInstituciones)
      .finally(() => setLoading(false))
  }, [tipo])

  return (
    <Autocomplete
      key={tipo.id ?? "none"}
      options={instituciones}
      getOptionLabel={(option) => option.nombre}
      loading={loading}
      value={institucion}
      onChange={(_, value) => setInstitucion(value)}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Institución"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps?.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  )
}
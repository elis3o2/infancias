import { useEffect, useState } from "react"
import { Autocomplete, TextField } from "@mui/material"
import type { Institucion, InstitucionFormData, TipoInstitucion } from "../../types"
import type { Setter } from "@/common/types"
import { getInstitucionByTipo } from "../../api"

type Props = {
    institucion: InstitucionFormData
    setInstitucion: Setter<InstitucionFormData>
    tipo: TipoInstitucion
}


export const InstitucionSelectForm = ({institucion, setInstitucion, tipo }: Props) => {
    const [instituciones, setInstituciones] = useState<Institucion[]>([])
    const [loading, setLoading] = useState(false)


    useEffect(() => {
        if (!tipo) {
            setInstituciones([])
            return
        }
        setLoading(true)
        getInstitucionByTipo(tipo.id)
            .then(setInstituciones)
            .finally(() => setLoading(false))

    }, [tipo])


    const institucionSeleccionada =
        instituciones.find(
            (item) => item.id === institucion?.id
        ) ?? null

    const handleChange = (_: React.SyntheticEvent, value: Institucion | null) => {

        if (value === null) {
            setInstitucion((prev) => ({
                ...prev,
                institucion: null,
            }))
            return
        }

        setInstitucion((prev) => ({
            ...prev,
            institucion: {
                id: value.id,
                nombre: value.nombre,
                domicilio: value.domicilio,
            },
        }))
    }


    return (
      <Autocomplete
          options={instituciones}
          getOptionLabel={(option) => option.nombre}
          loading={loading}
          value={institucionSeleccionada}
          onChange={handleChange}
          isOptionEqualToValue={(option, value) =>
              option.id === value.id
          }
          renderInput={(params) => (
              <TextField
                  {...params}
                  label="Institución"
              />
          )}
      />
    )
}
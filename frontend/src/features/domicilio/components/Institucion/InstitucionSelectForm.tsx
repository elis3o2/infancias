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
        let cancelado = false

        const cargarInstituciones = async () => {
            setLoading(true)

            try {
                const data = await getInstitucionByTipo(tipo.id)
                if (!cancelado) {
                    setInstituciones(data)
                }
            } catch (error) {
                if (!cancelado) {
                    console.error("No se pudieron cargar las instituciones:", error)
                    setInstituciones([])
                }
            } finally {
                if (!cancelado) {
                    setLoading(false)
                }
            }
        }

        void cargarInstituciones()

        return () => {
            cancelado = true
        }

    }, [tipo])


    const institucionSeleccionada =
        instituciones.find(
            (item) => item.id === institucion?.id
        ) ?? null

    const handleChange = (_: React.SyntheticEvent, value: Institucion | null) => {

        if (value === null) {
            setInstitucion((prev) => ({
                ...prev,
                id: null,
            }))
            return
        }

        setInstitucion((prev) => ({
            ...prev,
            id: value.id,
            nombre: value.nombre,
            tipo: value.tipo,
            domicilio: {
                nombre: value.domicilio.nombre,
                provincia: null,
                departamento: value.domicilio.departamento,
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

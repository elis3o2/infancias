import { useEffect } from "react"
import { Stack, TextField } from "@mui/material"
import { DepartamentoComponent } from "../DepartamentoComponet"
import { ProvinciaComponent } from "../ProvinciaComponent"
import type { Institucion, Departamento, Provincia, TipoInstitucion } from "../../types"
import type { Setter } from "@/common/types"

type Props = {
  institucion: Institucion
  setInstitucion: Setter<Institucion>
  tipo: TipoInstitucion
  onValidChange: (esValido: boolean) => void
}

export const InstitucionCargaForm = ({ institucion, setInstitucion, tipo, onValidChange }: Props) => {
  
    const esValido =
    institucion.nombre.trim() !== "" &&
    institucion.domicilio.nombre.trim() !== "" &&
    institucion.tipo != null &&
    institucion.domicilio.departamento != null &&
    institucion.domicilio.provincia != null

    console.log("INS", institucion)
  useEffect(() => {
    onValidChange?.(esValido)
  }, [esValido])

  useEffect(() => {
    setInstitucion((prev) => ({ ...prev, tipo }))
  }, [tipo])

    

  const setNombre = (nombre: string) => {
    setInstitucion((prev) => ({ ...prev, nombre }))
  }

  const setDomicilioNombre = (nombre: string) => {
        setInstitucion((prev) => ({
        ...prev,
        domicilio: { ...prev.domicilio, nombre },
        }))
    }

    const setProvincia = (provincia: Provincia) => {
        setInstitucion((prev) => ({
        ...prev,
        domicilio: { ...prev.domicilio, provincia, departamento: null },
        }))
    }

    const setDepartamento = (departamento: Departamento) => {
        setInstitucion((prev) => ({
            ...prev,
            domicilio: { ...prev.domicilio, departamento },
        }))
    }

    return (
    <Stack spacing={2}>
      <TextField
        label="Nombre"
        value={institucion.nombre}
        onChange={(e) => setNombre(e.target.value)}
        fullWidth
      />
      <TextField
        label="Domicilio"
        value={institucion.domicilio.nombre}
        onChange={(e) => setDomicilioNombre(e.target.value)}
        fullWidth
      />
      <ProvinciaComponent
        provincia={institucion.domicilio.provincia}
        setProvincia={setProvincia}
      />
      <DepartamentoComponent
        departamento={institucion.domicilio.departamento}
        setDepartamento={setDepartamento}
        id_provincia={institucion.domicilio.provincia ? institucion.domicilio.provincia.id : null}
      />
    </Stack>
  )
}
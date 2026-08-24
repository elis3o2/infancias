import type { Setter } from "@/common/types"
import { useState, useEffect } from "react"
import { Stack, Button, CardContent, Card, CardHeader } from "@mui/material"
import type { InstitucionFormData  } from "@/features/domicilio/types"
import { InstitucionInicial } from "@/features/domicilio/types"
import { InstitucionForm } from "@/features/domicilio/components/Institucion/InstitucionForm"
import { InstitucionesList } from "./InstitucionesList"

type Props = {
  instituciones: InstitucionFormData[]
  setInstituciones: Setter<InstitucionFormData[]>
  finishInstitucion: boolean
  setFinishInstitucion: Setter<boolean>
}

export const ReferenciaInstitucionComponent = ({ instituciones, setInstituciones, finishInstitucion, setFinishInstitucion }: Props) => {
  const [mostrarForm, setMostrarForm] = useState(instituciones.length === 0)
  const [institucionActual, setInstitucionActual] = useState<InstitucionFormData>(InstitucionInicial)

  useEffect(() => {
    if (finishInstitucion) {
      setInstituciones(prev => [...prev, institucionActual])
      setInstitucionActual(InstitucionInicial)
      setMostrarForm(false)
      setFinishInstitucion(false)
    }
  }, [finishInstitucion])

  const handleEliminar = (index: number) => {
    setInstituciones(instituciones.filter((_, i) => i !== index))
  }

  return (
    <Card variant="outlined" sx={{ minWidth:1028, borderRadius: 2 }}>
      <CardHeader
          title="Instituciones de referencia"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        />
      <CardContent>
        <Stack spacing={2}>
          {instituciones.length > 0  && 
            <InstitucionesList
              instituciones={instituciones}
              onEliminar={handleEliminar}
            />
          }

          {mostrarForm ? (
            <InstitucionForm
                institucion={institucionActual}
                setInstitucion={setInstitucionActual}
                setFinshInstitucion={setFinishInstitucion}
            />
          ) : (
            <Button variant="outlined" onClick={() => {setMostrarForm(true); setFinishInstitucion(false)}}>
              Agregar otra institucion
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
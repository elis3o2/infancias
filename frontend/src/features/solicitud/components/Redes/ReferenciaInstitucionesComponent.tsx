import type { Setter } from "@/common/types"
import { useState, useEffect } from "react"
import { Stack, Button, Typography, CardContent, Card, CardHeader } from "@mui/material"
import { InstitucionInicial, type Institucion,  } from "@/features/domicilio/types"
import { InstitucionForm } from "@/features/domicilio/components/Institucion/InstitucionForm"
import { InstitucionesCard } from "./InstitucionesCard"

type Props = {
  instituciones: Institucion[]
  setInstituciones: Setter<Institucion[]>
  finishInstitucion: boolean
  setFinishInstitucion: Setter<boolean>
}

export const ReferenciaInstitucionComponent = ({ instituciones, setInstituciones, finishInstitucion, setFinishInstitucion }: Props) => {
    const [mostrarForm, setMostrarForm] = useState(instituciones.length === 0)
    const [institucionActual, setInstitucionActual] = useState<Institucion>(InstitucionInicial)
    const [correoActual, setCorreoActual] = useState("")
    const [telefonoActual, setTelefonoActual] = useState("")

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
          console.log("INSS", instituciones)

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardHeader
          title="Instituciones de referencia"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        />
      <CardContent>
        <Stack spacing={2}>
          {instituciones.length > 0  && 
            <InstitucionesCard
              instituciones={instituciones}
              onEliminar={handleEliminar}
            />
          }

          {mostrarForm ? (
            <InstitucionForm
                institucion={institucionActual}
                setInstitucion={setInstitucionActual}
                setFinshInstitucion={setFinishInstitucion}
                telefono={telefonoActual}
                setTelefono={setTelefonoActual}
                correo={correoActual}
                setCorreo={setCorreoActual}
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
import type { Setter } from "@/common/types"
import type { Institucion, TipoInstitucion } from "../../types"
import { InstitucionInicial } from "../../types"
import { useEffect, useState } from "react"
import { ToggleButtonGroup, ToggleButton, Stack, Button } from "@mui/material"
import { TipoInstitucionComponent } from "../TipoInstitucionComponent"
import { InstitucionCargaForm } from "./InstitucionCargaForm"
import { InstitucionSelectForm } from "./InstitucionSelectForm"

type Props = {
  institucion: Institucion
  setInstitucion: Setter<Institucion>
  setFinshInstitucion: Setter<boolean>
}

type Modo = "seleccionar" | "cargar"

export const InstitucionForm = ({ institucion, setInstitucion, setFinshInstitucion }: Props) => {
  const [tipo, setTipo] = useState<TipoInstitucion | null>(null)
  const [modo, setModo] = useState<Modo>("seleccionar")
  const [institucionValida, setInstitucionValida] = useState(false)
  console.log(institucionValida)
  const formCompleto = (modo == "seleccionar" && institucion.id != -1) || 
                        modo == "cargar" &&  institucionValida


  // Al cambiar de modo, arranca todo limpio
  useEffect(() => {
    setInstitucion({...InstitucionInicial, tipo})
  }, [modo])

  function handleCargar() {
    setInstitucion((prev) => ({ ...prev }))
    setFinshInstitucion(true)
  }

  return (
    <Stack spacing={2} sx={{ minWidth: 1028 }}>
      <TipoInstitucionComponent tipoSeleccionado={tipo} setTipoSeleccionado={setTipo} />

      {tipo && (
        <>
          <ToggleButtonGroup
            value={modo}
            exclusive
            onChange={(_, value) => value && setModo(value)}
            size="small"
          >
            <ToggleButton value="seleccionar">Seleccionar existente</ToggleButton>
            <ToggleButton value="cargar">Cargar nueva</ToggleButton>
          </ToggleButtonGroup>

          {modo === "seleccionar" && (
            <InstitucionSelectForm institucion={institucion} setInstitucion={setInstitucion} tipo={tipo} />
          )}
          {modo === "cargar" && (
            <InstitucionCargaForm institucion={institucion} setInstitucion={setInstitucion} tipo={tipo} onValidChange={setInstitucionValida} />
          )}

          <Button variant="contained" onClick={handleCargar} disabled={!formCompleto} fullWidth>
            Guardar
          </Button>
        </>
      )}
    </Stack>
  )
}
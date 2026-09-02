import type { Setter } from "@/common/types"
import { InstitucionInicial, type InstitucionFormData, type TipoInstitucion } from "../../types"
import { useEffect, useState } from "react"
import { ToggleButtonGroup, ToggleButton, Stack, Button } from "@mui/material"
import { TipoInstitucionComponent } from "./TipoInstitucionComponent"
import { InstitucionCargaForm } from "./InstitucionCargaForm"
import { InstitucionSelectForm } from "./InstitucionSelectForm"

type Props = {
  institucion: InstitucionFormData
  setInstitucion: Setter<InstitucionFormData>
  setFinshInstitucion: Setter<boolean>
}


export const InstitucionForm = ({ institucion, setInstitucion, setFinshInstitucion}: Props) => {
  const [tipo, setTipo] = useState<TipoInstitucion | null>(null)
  const [institucionValida, setInstitucionValida] = useState(false)
  
  const formCompleto = (institucion.modo == "seleccionar" && institucion.id ) || 
                        institucion.modo == "cargar" &&  institucionValida

  // Al cambiar de modo, arranca todo limpio
  function handleCargar() {
    setInstitucion((prev) => ({ ...prev }))
    setFinshInstitucion(true)
  }



  return (
    <Stack spacing={2}>
      <TipoInstitucionComponent tipoSeleccionado={tipo} setTipoSeleccionado={setTipo} />

      {tipo && (
          <>
            <ToggleButtonGroup
              value={institucion.modo}
              exclusive
              onChange={(_, value) => {
                if (value !== null) {
                setInstitucion({
                  ...InstitucionInicial,
                  modo: value,
                });
                }
              }}
              size="small"
            >
            <ToggleButton value="seleccionar">Seleccionar existente</ToggleButton>
            <ToggleButton value="cargar">Cargar nueva</ToggleButton>
          </ToggleButtonGroup>

          {institucion.modo === "seleccionar" && (
            <InstitucionSelectForm institucion={institucion} setInstitucion={setInstitucion} tipo={tipo} />
          )}
          {institucion.modo === "cargar" && (
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
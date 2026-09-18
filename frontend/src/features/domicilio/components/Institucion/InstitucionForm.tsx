import type { Setter } from "@/common/types"
import { InstitucionInicial, type InstitucionFormData, type TipoInstitucion } from "../../types"
import { useState } from "react"
import { ToggleButtonGroup, ToggleButton, Stack, Button } from "@mui/material"
import { TipoInstitucionComponent } from "./TipoInstitucionComponent"
import { InstitucionCargaForm } from "./InstitucionCargaForm"
import { InstitucionSelectForm } from "./InstitucionSelectForm"

type Props = {
  institucion: InstitucionFormData
  setInstitucion: Setter<InstitucionFormData>
  setFinshInstitucion?: Setter<boolean>
  onGuardar?: (institucion: InstitucionFormData) => void
}


export const InstitucionForm = ({ institucion, setInstitucion, setFinshInstitucion, onGuardar}: Props) => {
  const [tipo, setTipo] = useState<TipoInstitucion | null>(institucion.tipo)
  const [institucionValida, setInstitucionValida] = useState(false)
  
  const formCompleto =
    (institucion.modo === "seleccionar" && institucion.id !== null) ||
    (institucion.modo === "cargar" && institucionValida)

  function handleCargar() {
    if (!formCompleto) return

    onGuardar?.(institucion)
    setFinshInstitucion?.(true)
  }

  const handleTipoSeleccionado = (nuevoTipo: TipoInstitucion | null) => {
    setTipo(nuevoTipo)
    setInstitucion({
      ...InstitucionInicial,
      tipo: nuevoTipo,
      modo: "seleccionar",
    })
    setInstitucionValida(false)
  }

  const handleModo = (modo: "seleccionar" | "cargar" | null) => {
    if (modo === null) return

    setInstitucion({
      ...InstitucionInicial,
      tipo,
      modo,
    })
    setInstitucionValida(false)
  }


  return (
    <Stack spacing={2}>
      <TipoInstitucionComponent
        tipoSeleccionado={tipo}
        setTipoSeleccionado={handleTipoSeleccionado}
      />

      {tipo && (
          <>
            <ToggleButtonGroup
              value={institucion.modo}
              exclusive
              onChange={(_, value: "seleccionar" | "cargar" | null) => handleModo(value)}
              size="small"
            >
            <ToggleButton value="seleccionar">Seleccionar existente</ToggleButton>
            <ToggleButton value="cargar">Cargar nueva</ToggleButton>
          </ToggleButtonGroup>

          {institucion.modo === "seleccionar" && (
            <InstitucionSelectForm institucion={institucion} setInstitucion={setInstitucion} tipo={tipo} />
          )}
          {institucion.modo === "cargar" && (
            <InstitucionCargaForm
              institucion={institucion}
              setInstitucion={setInstitucion}
              onValidChange={setInstitucionValida}
            />
          )}

          <Button variant="contained" onClick={handleCargar} disabled={!formCompleto} fullWidth>
            Guardar
          </Button>
        </>
      )}
    </Stack>
  )
}

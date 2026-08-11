import type { Setter } from "@/common/types"
import type { Institucion, TipoInstitucion } from "../../types"
import { InstitucionInicial } from "../../types"
import { useEffect, useState } from "react"
import { ToggleButtonGroup, ToggleButton, Stack, Button } from "@mui/material"
import { TipoInstitucionComponent } from "../TipoInstitucionComponent"
import { TelefonoComponent } from "@/features/persona/componets/TelefonoComponent"
import { CorreoForm } from "@/features/persona/componets/CorreoForm"
import { InstitucionCargaForm } from "./InstitucionCargaForm"
import { InstitucionSelectForm } from "./InstitucionSelectForm"

type Props = {
  institucion: Institucion
  setInstitucion: Setter<Institucion>
  setFinshInstitucion: Setter<boolean>
  correo: string
  setCorreo: Setter<string>
  telefono: string
  setTelefono: Setter<string>
}

type Modo = "seleccionar" | "cargar"

export const InstitucionForm = ({ institucion, setInstitucion, setFinshInstitucion, correo, setCorreo, telefono, setTelefono }: Props) => {
  const [tipo, setTipo] = useState<TipoInstitucion | null>(null)
  const [modo, setModo] = useState<Modo>("seleccionar")
  const [correoValido, setCorreoValido] = useState(false)
  const [institucionValida, setInstitucionValida] = useState(false)

  const modoValido = modo === "seleccionar"
    ? Boolean(institucion.id && institucion.id !== -1)
    : institucionValida

  const formCompleto = Boolean(telefono) && telefono.length === 10 && correoValido && modoValido

  // Sincroniza correo/telefono desde la institución elegida, solo en modo "seleccionar"
  useEffect(() => {
    if (modo === "seleccionar" && institucion.id !== -1) {
      setCorreo(institucion.correo ?? "")
      setTelefono(institucion.telefono ?? "")
    }
  }, [institucion.id, modo])

  // Al cambiar de modo, arranca todo limpio
  useEffect(() => {
    setInstitucion(InstitucionInicial)
    setCorreo("")
    setTelefono("")
  }, [modo])

  function handleCargar() {
    setInstitucion((prev) => ({ ...prev, correo, telefono }))
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
          <TelefonoComponent telefono={telefono} setTelefono={setTelefono} />
          <CorreoForm correo={correo} setCorreo={setCorreo} onValidChange={setCorreoValido} />
          <Button variant="contained" onClick={handleCargar} disabled={!formCompleto} fullWidth>
            Guardar
          </Button>
        </>
      )}
    </Stack>
  )
}
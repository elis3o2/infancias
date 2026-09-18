import { Alert, Box, Button, Stack } from "@mui/material"
import type { Setter } from "@/common/types"
import type { Domicilio, DomicilioFormData } from "../types"
import { DomicilioComponent } from "./Domicilio/DomicilioComponent"
import { Mapa } from "./Mapa"
import { useState } from "react"

type Props = {
  domicilio: Domicilio
  nuevoDomicilio: DomicilioFormData | null
  setNuevoDomicilio: Setter<DomicilioFormData | null>
}

type Modo = "original" | "editando" | "nuevo"

export const CambiarDomicilio = ({ domicilio, nuevoDomicilio, setNuevoDomicilio }: Props) => {
  const [modo, setModo] = useState<Modo>("original")

  const handleCambiar = () => {
    setModo("editando")
  }

  const handleVolver = () => {
    setNuevoDomicilio(null)
    setModo("original")
  }

  const domicilioAMostrar = modo === "nuevo" ? nuevoDomicilio : domicilio
  const domicilioValidado = domicilioAMostrar?.domicilio_validado

  const handleGuardar = (domicilioNuevo: DomicilioFormData) => {
    setNuevoDomicilio(domicilioNuevo)
    setModo("nuevo")
  }

  return (
    <>
      {modo !== "editando" && domicilioAMostrar && (
        <>
          {domicilioValidado ? (
            <Box sx={{ height: 400, width: "100%", mt: 5 }}>
              <Mapa
                latitud={domicilioValidado.latitud}
                longitud={domicilioValidado.longitud}
                nombre={domicilioAMostrar.nombre}
              />
            </Box>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              Este domicilio no tiene una ubicación georreferenciada para mostrar en el mapa.
            </Alert>
          )}

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={handleCambiar}>
              Cambiar domicilio
            </Button>

            {modo === "nuevo" && (
              <Button variant="text" onClick={handleVolver}>
                Volver al domicilio original
              </Button>
            )}
          </Stack>
        </>
      )}

      {modo === "editando" && (
        <DomicilioComponent
          domicilios={[]}
          domicilio={nuevoDomicilio}
          onGuardar={handleGuardar}
          onLimpiar={() => setNuevoDomicilio(null)}
        />
      )}
    </>
  )
}

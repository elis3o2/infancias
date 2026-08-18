import { Box, Button, Stack } from "@mui/material"
import type { Setter } from "@/common/types"
import type { Domicilio } from "../types"
import { DomicilioComponent } from "./DomicilioComponent"
import { Mapa } from "./Mapa"
import { useEffect, useState } from "react"

type Props = {
  domicilio: Domicilio
  nuevoDomicilio: Domicilio | null
  setNuevoDomicilio: Setter<Domicilio | null>
}

type Modo = "original" | "editando" | "nuevo"

export const CambiarDomicilio = ({ domicilio, nuevoDomicilio, setNuevoDomicilio }: Props) => {
  const [finishDomicilio, setFinishDomicilio] = useState(false)
  const [modo, setModo] = useState<Modo>("original")

  // cuando DomicilioComponent termina de cargar el domicilio nuevo,
  // cerramos el form y pasamos a mostrar el mapa con el nuevo domicilio
  useEffect(() => {
    if (finishDomicilio) {
      setModo("nuevo")
      setFinishDomicilio(false)
    }
  }, [finishDomicilio])

  const handleCambiar = () => {
    setModo("editando")
  }

  const handleVolver = () => {
    setNuevoDomicilio(null)
    setModo("original")
  }

  const domicilioAMostrar = modo === "nuevo" ? nuevoDomicilio : domicilio

  return (
    <>
      {modo !== "editando" && domicilioAMostrar && (
        <>
          <Box sx={{ height: 400, width: "100%", mt: 5 }}>
            <Mapa
              latitud={domicilioAMostrar.domicilio_validado.coordenada_x}
              longitud={domicilioAMostrar.domicilio_validado.coordenada_y}
              nombre={domicilioAMostrar.nombre}
            />
          </Box>

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
          domicilio={nuevoDomicilio}
          setDomicilio={setNuevoDomicilio}
          finishDomicilio={finishDomicilio}
          setFinishDomicilio={setFinishDomicilio}
        />
      )}
    </>
  )
}
import type { Setter } from "@/common/types"
import { useState } from "react"
import { Stack, Button, Typography } from "@mui/material"
import type { Institucion } from "@/features/domicilio/types"
import { TeritorialForm } from "./TerritorialForm"
import { TerritorialView } from "./TerritorialView"

type Props = {
  territoriales: Institucion[]
  setTerritorials: Setter<Institucion[]>
}

export const TerritorialComponent = ({ territoriales, setTerritorials }: Props) => {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [territorialActual, setTerritorialActual] = useState<Institucion | null>(null)
  const [finishTerritorial, setFinishTerritorial] = useState(false)

  if (finishTerritorial && territorialActual != null) {
    setTerritorials([...territoriales, territorialActual])
    setTerritorialActual(null)
    setFinishTerritorial(false)
    setMostrarForm(false)
  }

  const handleEliminar = (index: number) => {
    setTerritorials(territoriales.filter((_, i) => i !== index))
  }

  return (
    <Stack spacing={2} sx={{ minWidth: 1028 }}>
      <Typography variant="h6">Territorial</Typography>

      {territoriales.map((territorial, index) => (
        <TerritorialView
          key={index}
          territorio={territorial}
          onEliminar={() => handleEliminar(index)}
        />
      ))}

      {mostrarForm ? (
        <TeritorialForm
            territorioSeleccionada={territorialActual}
            setTerritorialSeleccionada={setTerritorialActual}
            setFinishTerritorial={setFinishTerritorial}

        />
      ) : (
        <Button variant="outlined" onClick={() => setMostrarForm(true)}>
          Agregar territorial
        </Button>
      )}

    </Stack>
  )
}
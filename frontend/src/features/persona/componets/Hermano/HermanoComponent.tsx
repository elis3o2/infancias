import type { Hermano } from "../../types"
import type { Setter } from "@/common/types"
import { useState } from "react"
import { Stack, Button, Typography } from "@mui/material"
import { HermanoForm } from "./HermanoForm"
import { HermanoView } from "./HermanoView"

type Props = {
  hermanos: Hermano[]
  setHermanos: Setter<Hermano[]>
}

export const HermanosComponent = ({ hermanos, setHermanos }: Props) => {
  const [mostrarForm, setMostrarForm] = useState(hermanos.length === 0)
  const [hermanoActual, setHermanoActual] = useState<Hermano | null>(null)
  const [finishHermano, setFinishHermano] = useState(false)

  if (finishHermano && hermanoActual != null) {
    setHermanos([...hermanos, hermanoActual])
    setHermanoActual(null)
    setFinishHermano(false)
    setMostrarForm(false)
  }

  const handleEliminar = (index: number) => {
    setHermanos(hermanos.filter((_, i) => i !== index))
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Hermanos menores de 18 años</Typography>

      {hermanos.map((hermano, index) => (
        <HermanoView
          key={index}
          hermano={hermano}
          onEliminar={() => handleEliminar(index)}
        />
      ))}

      {mostrarForm ? (
        <HermanoForm
          setHermano={setHermanoActual}
          setFinishHermano={setFinishHermano}
        />
      ) : (
        <Button variant="outlined" onClick={() => setMostrarForm(true)}>
          Agregar otro hermano
        </Button>
      )}

    </Stack>
  )
}
import type { Hermano } from "../../types"
import type { Setter } from "@/common/types"
import { useState } from "react"
import { Stack, Button, Typography, Card, CardContent, CardHeader} from "@mui/material"
import { HermanoForm } from "./HermanoForm"
import { HermanoView } from "./HermanoView"

type Props = {
  hermanos: Hermano[]
  setHermanos: Setter<Hermano[]>
  finishHermano: boolean
  setFinishHermano: Setter<boolean>
}

export const HermanosComponent = ({ hermanos, setHermanos, finishHermano, setFinishHermano }: Props) => {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [hermanoActual, setHermanoActual] = useState<Hermano | null>(null)

  if (finishHermano && hermanoActual != null) {
    setHermanos([...hermanos, hermanoActual])
    setHermanoActual(null)
    setMostrarForm(false)
  }

  const handleEliminar = (index: number) => {
    setHermanos(hermanos.filter((_, i) => i !== index))
  }

  return (
  <Card variant="outlined" sx={{ borderRadius: 2 }}>
    <CardHeader
        title="Hermanos menores de 18 años"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
      />
      <CardContent>
        <Stack spacing={2} sx={{ minWidth: 1028 }}>
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
            <Button variant="outlined" onClick={() => {setMostrarForm(true); setFinishHermano(false)}}>
              Agregar hermano
            </Button>
          )}
        </Stack>
    </CardContent>
  </Card>
  )
}
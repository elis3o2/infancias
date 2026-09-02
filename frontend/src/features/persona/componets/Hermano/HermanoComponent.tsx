import type { HermanoCreate } from "../../types"
import type { Setter } from "@/common/types"
import { useEffect, useState } from "react"
import { Stack, Button } from "@mui/material"
import { HermanoForm } from "./HermanoForm"
import { HermanosList } from "./HermanosList"
import { ConditionalCard } from "@/common/components/ConditionalCard"

type Props = {
  hermanos: HermanoCreate[]
  setHermanos: Setter<HermanoCreate[]>
  finishHermano: boolean
  setFinishHermano: Setter<boolean>
}

export const HermanosComponent = ({ hermanos, setHermanos, finishHermano, setFinishHermano }: Props) => {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [hermanoActual, setHermanoActual] = useState<HermanoCreate | null>(null)

  useEffect(() => {
    if (finishHermano && hermanoActual != null) {
      setHermanos(prev => [...prev, hermanoActual])
      setHermanoActual(null)
      setMostrarForm(false)
      setFinishHermano(false)
    }
  }, [finishHermano, hermanoActual])

  const handleEliminar = (index: number) => {
    setHermanos(hermanos.filter((_, i) => i !== index))
  }

  return (
    <ConditionalCard
      titulo="Hermanos menores de 18 años"
      condicion={mostrarForm}
      componenteTrue={
        <Stack spacing={2} >
          {hermanos.length > 0 && <HermanosList hermanos={hermanos} onEliminar={handleEliminar} />}
          <HermanoForm setHermano={setHermanoActual} setFinishHermano={setFinishHermano} />
        </Stack>
      }
      componenteFalse={
        <Stack spacing={2}>
          {hermanos.length > 0 && <HermanosList hermanos={hermanos} onEliminar={handleEliminar} />}
          <Button variant="outlined" onClick={() => { setMostrarForm(true); setFinishHermano(false) }}>
            Agregar hermano
          </Button>
        </Stack>
      }
    />
  )
}
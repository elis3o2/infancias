import type { Setter } from "@/common/types"
import { useState } from "react"
import { Stack, Button, Typography } from "@mui/material"
import type { Referencia } from "@/features/domicilio/types"
import { ReferenciaForm } from "./ReferenciaForm"
import { ReferenciaView } from "./ReferenciaView"

type Props = {
  referencias: Referencia[]
  setReferencias: Setter<Referencia[]>
  api: () => Promise<Referencia[]>
  nombre: string
}

export const ReferenciaComponent = ({ referencias, setReferencias, api, nombre }: Props) => {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [referenciaActual, setReferenciaActual] = useState<Referencia | null>(null)
  const [finishReferencia, setFinishReferencia] = useState(false)

  if (finishReferencia && referenciaActual != null) {
    setReferencias([...referencias, referenciaActual])
    setReferenciaActual(null)
    setFinishReferencia(false)
    setMostrarForm(false)
  }

  const handleEliminar = (index: number) => {
    setReferencias(referencias.filter((_, i) => i !== index))
  }

  return (
    <Stack spacing={2} sx={{ minWidth: 1028 }}>
      <Typography variant="h6">{nombre}</Typography>

      {referencias.map((referencia, index) => (
        <ReferenciaView
          key={index}
          referencia={referencia}
          onEliminar={() => handleEliminar(index)}
        />
      ))}

      {mostrarForm ? (
        <ReferenciaForm
        referenciaSeleccionada={referenciaActual}
        setReferenciaSeleccionada={setReferenciaActual}
        setFinishReferencia={setFinishReferencia}
        api={api}
        nombre={nombre}
        />
      ) : (
        <Button variant="outlined" onClick={() => setMostrarForm(true)}>
          Agregar institución de referencia
        </Button>
      )}

    </Stack>
  )
}
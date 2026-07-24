import type { Familiar } from "../../types"
import type { Setter } from "@/common/types"
import { useState } from "react"
import { Stack, Button, Typography } from "@mui/material"
import { FamiliarForm } from "./FamiliarForm"
import { FamiliarView } from "./FamiliarView"

type Props = {
  familiares: Familiar[]
  setFamiliares: Setter<Familiar[]>
}

export const FamiliaresComponent = ({ familiares, setFamiliares }: Props) => {
  const [mostrarForm, setMostrarForm] = useState(familiares.length === 0)
  const [familiarActual, setFamiliarActual] = useState<Familiar | null>(null)
  const [finishFamiliar, setFinishFamiliar] = useState(false)

  if (finishFamiliar && familiarActual != null) {
    setFamiliares([...familiares, familiarActual])
    setFamiliarActual(null)
    setFinishFamiliar(false)
    setMostrarForm(false)
  }

  const handleEliminar = (index: number) => {
    setFamiliares(familiares.filter((_, i) => i !== index))
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Familiares / referentes</Typography>

      {familiares.map((familiar, index) => (
        <FamiliarView
          key={index}
          familiar={familiar}
          onEliminar={() => handleEliminar(index)}
        />
      ))}

      {mostrarForm ? (
        <FamiliarForm
          setFamiliar={setFamiliarActual}
          setFinishFamiliar={setFinishFamiliar}
        />
      ) : (
        <Button variant="outlined" onClick={() => setMostrarForm(true)}>
          Agregar otro familiar
        </Button>
      )}

      {familiares.length === 0 && !mostrarForm && (
        <Typography color="error" variant="caption">
          Debe cargar al menos un familiar o referente
        </Typography>
      )}
    </Stack>
  )
}
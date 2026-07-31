import type { Familiar } from "../../types"
import type { Setter } from "@/common/types"
import { useState } from "react"
import { Stack, Button, Typography,Card, CardHeader, CardContent } from "@mui/material"
import { FamiliarForm } from "./FamiliarForm"
import { FamiliarView } from "./FamiliarView"

type Props = {
  familiares: Familiar[]
  setFamiliares: Setter<Familiar[]>
  finishFamiliar: boolean
  setFinishFamiliar: Setter<boolean>
}

export const FamiliaresComponent = ({ familiares, setFamiliares, finishFamiliar, setFinishFamiliar }: Props) => {
  const [mostrarForm, setMostrarForm] = useState(familiares.length === 0)
  const [familiarActual, setFamiliarActual] = useState<Familiar | null>(null)

  if (finishFamiliar && familiarActual != null) {
    setFamiliares([...familiares, familiarActual])
    setFamiliarActual(null)
    setMostrarForm(false)
  }

  const handleEliminar = (index: number) => {
    setFamiliares(familiares.filter((_, i) => i !== index))
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardHeader
          title="Familiares / referentes"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        />
      <CardContent>
        <Stack spacing={2}>
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
            <Button variant="outlined" onClick={() => {setMostrarForm(true); setFinishFamiliar(false)}}>
              Agregar otro familiar
            </Button>
          )}

          {familiares.length === 0 && !mostrarForm && (
            <Typography color="error" variant="caption">
              Debe cargar al menos un familiar o referente
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
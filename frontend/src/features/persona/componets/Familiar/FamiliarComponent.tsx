import type { FamiliarCreate } from "../../types"
import type { Setter } from "@/common/types"
import { useState } from "react"
import { Stack, Button,Card, CardHeader, CardContent } from "@mui/material"
import { FamiliarForm } from "./FamiliarForm"
import { FamiliaresList } from "./FamiliaresList"

type Props = {
  familiares: FamiliarCreate[]
  setFamiliares: Setter<FamiliarCreate[]>
  finishFamiliar: boolean
  setFinishFamiliar: Setter<boolean>
}

export const FamiliaresComponent = ({ familiares, setFamiliares, finishFamiliar, setFinishFamiliar }: Props) => {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [familiarActual, setFamiliarActual] = useState<FamiliarCreate | null>(null)

  if (finishFamiliar && familiarActual != null) {
    setFamiliares([...familiares, familiarActual])
    setFamiliarActual(null)
    setMostrarForm(false)
  }

  const handleEliminar = (index: number) => {
    setFamiliares(familiares.filter((_, i) => i !== index))
  }

  return (
    <Card variant="outlined" sx={{ minWidth: 1028, borderRadius: 2 }}>
      <CardHeader
          title="Familiares / referentes"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        />
      <CardContent>
        <Stack spacing={2}>
          {familiares.length > 0  && 
            <FamiliaresList
              familiares={familiares}
              onEliminar={handleEliminar}
            />
          }

          {mostrarForm ? (
            <FamiliarForm
              setFamiliar={setFamiliarActual}
              setFinishFamiliar={setFinishFamiliar}
            />
          ) : (
            <Button variant="outlined" onClick={() => {setMostrarForm(true); setFinishFamiliar(false)}}>
              Agregar
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
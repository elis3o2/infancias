import type { FamiliarCreate } from "../../types"
import type { Setter } from "@/common/types"
import { useEffect, useState } from "react"
import { Stack, Button } from "@mui/material"
import { FamiliarForm } from "./FamiliarForm"
import { FamiliaresList } from "./FamiliaresList"
import { ConditionalCard } from "@/common/components/ConditionalCard"
import type { DomicilioFormData } from "@/features/domicilio/types"

type Props = {
  familiares: FamiliarCreate[]
  setFamiliares: Setter<FamiliarCreate[]>
  domicilios: DomicilioFormData[]
  finishFamiliar: boolean
  setFinishFamiliar: Setter<boolean>
}

export const FamiliaresComponent = ({ familiares, setFamiliares, finishFamiliar, setFinishFamiliar, domicilios }: Props) => {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [familiarActual, setFamiliarActual] = useState<FamiliarCreate | null>(null)

  useEffect(() => {
    if (finishFamiliar && familiarActual != null) {
      setFamiliares(prev => [...prev, familiarActual])
      setFamiliarActual(null)
      setMostrarForm(false)
      setFinishFamiliar(false)
    }
  }, [finishFamiliar, familiarActual])

  const handleEliminar = (index: number) => {
    setFamiliares(familiares.filter((_, i) => i !== index))
  }

  return (
    <ConditionalCard
      titulo="Familiares / referentes"
      condicion={mostrarForm}
      componenteTrue={
        <Stack spacing={2}>
          {familiares.length > 0 && <FamiliaresList familiares={familiares} onEliminar={handleEliminar} />}
          <FamiliarForm setFamiliar={setFamiliarActual} setFinishFamiliar={setFinishFamiliar} domicilios={domicilios}/>
        </Stack>
  
      }
      componenteFalse={
        <Stack spacing={2}>
          {familiares.length > 0 && <FamiliaresList familiares={familiares} onEliminar={handleEliminar} />}
          <Button variant="outlined" onClick={() => { setMostrarForm(true); setFinishFamiliar(false) }}>
            Agregar
          </Button>
        </Stack>
      }
    />
  )
}
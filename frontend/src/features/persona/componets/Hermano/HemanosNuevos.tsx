import { useState } from "react"
import { Button,  Stack } from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import type { Setter } from "@/common/types"
import type { Hermano } from "../../types"
import { AgregarHermano } from "./AgregarHemano"

type Props = {
  hermanos: Hermano[]
  setHermanos: Setter<Hermano[]>
}

export const HermanosNuevos = ({ hermanos, setHermanos }: Props) => {
  const [mostrarForm, setMostrarForm] = useState(false)

  const handleHermanoAgregado = (hermano: Hermano) => {
    if (hermanos.some((h) => h.dni === hermano.dni)) return
    setHermanos([...hermanos, hermano])
    setMostrarForm(false) // ocultamos el form despues de agregar
  }

  return (
    <Stack spacing={2}>
      {mostrarForm ? (
        <AgregarHermano onHermanoAgregado={handleHermanoAgregado} />
      ) : (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setMostrarForm(true)}
        >
          Agregar hermano
        </Button>
      )}
    </Stack>
  )
}
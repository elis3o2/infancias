import { useState } from "react"
import { Button,  Stack } from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import type { Setter } from "@/common/types"
import type { Persona } from "../../types"
type Props = {
  personas: Persona[]
  setPersonas: Setter<Persona[]>
}

export const NuevaPersona = ({ personas, setPersonas }: Props) => {
  const [mostrarForm, setMostrarForm] = useState(false)

  const handlePersonaAgregado = (persona: Persona) => {
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
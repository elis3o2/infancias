import { useState } from "react"
import { Button,  Stack } from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import type { Setter } from "@/common/types"
import type { Persona } from "../../types"
import { AgregarPersona } from "./AgregarPersona"
type Props = {
  personas: Persona[]
  setPersonas: Setter<Persona[]>
}

export const NuevaPersona = ({ personas, setPersonas }: Props) => {
  const [mostrarForm, setMostrarForm] = useState(false)

  const handlePersonaAgregado = (persona: Persona) => {
    if (personas.some((h) => h.dni === persona.dni)) return
      setPersonas([...personas, persona])
    setMostrarForm(false) // ocultamos el form despues de agregar
  }

  return (
    <Stack spacing={2}>
      {mostrarForm ? (
        <AgregarPersona onPersonaAgregado={handlePersonaAgregado} />
      ) : (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setMostrarForm(true)}
        >
          Agregar
        </Button>
      )}
    </Stack>
  )
}
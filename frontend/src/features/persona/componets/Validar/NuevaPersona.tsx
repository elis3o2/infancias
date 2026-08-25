import { useState } from "react"
import { Button,  Stack } from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import type { Setter } from "@/common/types"
import type { PersonaCreate } from "../../types"
import { AgregarPersona } from "./AgregarPersona"

type Props = {
  personas: PersonaCreate[]
  setPersonas: Setter<PersonaCreate[]>
  datos_extra: boolean
}

export const NuevaPersona = ({ personas, setPersonas, datos_extra}: Props) => {
  const [mostrarForm, setMostrarForm] = useState(false)

  const handlePersonaAgregado = (persona: PersonaCreate) => {
    if (personas.some((h) => h.dni === persona.dni)) return
      setPersonas([...personas, persona])
    setMostrarForm(false) // ocultamos el form despues de agregar
  }

  return (
    <Stack spacing={2}>
      {mostrarForm ? (
        <AgregarPersona onPersonaAgregado={handlePersonaAgregado} datos_extra={datos_extra} />
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
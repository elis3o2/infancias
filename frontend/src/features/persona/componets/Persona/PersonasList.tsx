import type { Persona, PersonaCreate } from "../../types"
import { Stack, Divider, Box } from "@mui/material"
import { ListData } from "@/common/components/ListData"

type Props = {
  personas: Persona[] | PersonaCreate[]
}

export const PersonasList = ({ personas }: Props) => {
  return (
        <Stack spacing={2}>
        {personas.map((persona, index) => (
            <Box key={index}>
        <ListData
            nombre={persona.nombre}
            dni={persona.dni}
            sexo={persona.sexo}
            apellido={persona.apellido}
            fecha_nacimiento={persona.fecha_nacimiento}
            {...(persona.vinculo ? { vinculo: persona.vinculo.nombre } : {})}
            {...(persona.telefono ? { telefono: persona.telefono } : {})}
            {...(persona.domicilio ? { domicilio: persona.domicilio.nombre } : {})}
        />
            {index < personas.length - 1 && (
                <Divider sx={{ mt: 2 }} />
            )}
            </Box>
        ))}
        </Stack>
  )
}
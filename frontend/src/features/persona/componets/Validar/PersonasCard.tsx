import { Card, CardContent, CardHeader } from "@mui/material"
import type { Persona } from "../../types"
import { PersonasList } from "./PersonasList"

type Props = {
  personas: Persona[]
  titulo: string
}

export const PersonasCard = ({personas, titulo}: Props) => {
  return (
    <Card sx={{minWidth: 1028}}>
    <CardHeader
          title={titulo}
          titleTypographyProps={{ variant: 'h6', fontWeight: 300 }}
        />
      <CardContent>
        <PersonasList
          personas={personas}
        />
      </CardContent>
    </Card>
  )
}
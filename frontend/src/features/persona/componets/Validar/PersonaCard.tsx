import { Card, CardContent, CardHeader } from "@mui/material"
import type { Persona } from "../../types"
import { PersonaList } from "./PersonaList"

type Props = {
  persona: Persona
  titulo: string
}

export const PersonaCard = ({persona, titulo}: Props) => {
  return (
    <Card sx={{minWidth: 1028}}>
    <CardHeader
          title={titulo}
          titleTypographyProps={{ variant: 'h6', fontWeight: 300 }}
        />
      <CardContent>
        <PersonaList
          persona={persona}
        />
      </CardContent>
    </Card>
  )
}
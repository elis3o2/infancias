import { Card, CardContent, CardHeader } from "@mui/material"
import { InstitucionList } from "./InstitucionList"
import type { Institucion } from "../../types"

type Props = {
  institucion: Institucion
}

export const InstitucionCard = ({institucion}: Props) => {
  return (
    <Card sx={{minWidth: 1028}}>
    <CardHeader
          title="Institucion solicitante"
          titleTypographyProps={{ variant: 'h6', fontWeight: 300 }}
        />
      <CardContent>
        <InstitucionList
          institucion={institucion}
        />
      </CardContent>
    </Card>
  )
}
import { Card, CardContent } from "@mui/material"
import type { Institucion } from "../../types"
import { InstitucionesList } from "./InstitucionesList"

type Props = {
  instituciones: Institucion[]
}

export const InstitucionesCard = ({instituciones }: Props) => {
  return (
    <Card sx={{minWidth: 1028}}>
        Instituciones de referencia
      <CardContent>
        <InstitucionesList
          instituciones={instituciones}
        />
      </CardContent>
    </Card>
  )
}
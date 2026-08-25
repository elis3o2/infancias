import type { Familiar } from "../../types"
import { Card, CardHeader, CardContent } from "@mui/material"
import { FamiliaresList } from "./FamiliaresList"

type Props = {
  familiares: Familiar[]
}

export const FamiliaresCard = ({ familiares }: Props) => {
  return (
    <Card sx={{minWidth: 1028}}>
    <CardHeader
          title="Familiares / referentes"
          titleTypographyProps={{ variant: 'h6', fontWeight: 300 }}
        />
      <CardContent>
    <FamiliaresList
        familiares={familiares}
    />
    </CardContent>
    </Card>
  )
}
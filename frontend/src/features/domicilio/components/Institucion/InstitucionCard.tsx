import type { Institucion, InstitucionFormData } from "../../types"
import { Card, CardContent } from "@mui/material"

import { ListData } from "@/common/components/ListData";

type Props = {
  institucion: InstitucionFormData | Institucion
  onEditar?: () => void
}


export const InstitucionCard = ({ institucion, onEditar }: Props) => {

  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <ListData
          institucion_nombre={institucion.nombre}
          institucion_domicilio={institucion.domicilio.nombre}
          institucion_tipo={institucion.tipo?.nombre}
          onEditar={onEditar}
        />
      </CardContent>

    </Card>
  )
}
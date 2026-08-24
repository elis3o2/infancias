import type { Institucion, InstitucionFormData } from "../../types"

import { ListData } from "@/common/components/ListData";

type Props = {
  institucion: InstitucionFormData | Institucion
  onEditar?: () => void
}


export const InstitucionList= ({ institucion, onEditar }: Props) => {

  return (
        <ListData
          institucion_nombre={institucion.nombre}
          institucion_domicilio={institucion.domicilio.nombre}
          institucion_tipo={institucion.tipo?.nombre}
          onEditar={onEditar}
          texto="Editar"
        />
  )
}
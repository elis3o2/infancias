import type { Familiar } from "../../types"
import { ListData } from "@/common/components/ListData"

type Props = {
  familiar: Familiar
}

export const FamiliarList = ({ familiar }: Props) => {
  return (
        <ListData
            nombre={familiar.nombre}
            apellido={familiar.apellido}
              {...(familiar.dni != null && { dni: familiar.dni })}
              {...(familiar.sexo != null && { sexo: familiar.sexo })}
              {...(familiar.domicilio?.nombre != null && { domicilio: familiar.domicilio.nombre})}
              {...(familiar.telefono != null && { telefono: familiar.telefono })}
              {...(familiar.vinculo != null && { vinculo: familiar.vinculo.nombre })}
            />
  )
}
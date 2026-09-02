import type { Hermano, HermanoCreate } from "../../types";
import { ListData } from "@/common/components/ListData";


type Props = {
    hermano : Hermano | HermanoCreate
    onEliminar?: () => void
}

export const HermanoList = ({ hermano, onEliminar }: Props) => {
  
  return (<>
            <ListData
              nombre={hermano.nombre}
              apellido={hermano.apellido}
              {...(hermano.sexo != "" && { sexo: hermano.sexo })}
              dni={hermano.dni}
              fecha_nacimiento={hermano.fecha_nacimiento}
              onEditar={onEliminar}
              texto="Eliminar"
              />
          </>)
}
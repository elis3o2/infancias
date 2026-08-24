import type { Hermano } from "../../types";
import { ListData } from "@/common/components/ListData";


type Props = {
    hermano : Hermano 
}

export const HermanoList = ({ hermano }: Props) => {
  
  return (<>
            <ListData
              nombre={hermano.nombre}
              apellido={hermano.apellido}
              sexo={hermano.sexo}
              dni={hermano.dni}
              fecha_nacimiento={hermano.fecha_nacimiento}
              />
          </>)
}
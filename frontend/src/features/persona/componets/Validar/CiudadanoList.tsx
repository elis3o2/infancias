import type { Ciudadano } from "../../types";
import { ListData } from "@/common/components/ListData";


type Props = {
    ciudadano : Ciudadano
}

export const CiudadanoList = ({ ciudadano }: Props) => {
  return (<>
            <ListData
              nombre={ciudadano.nombre}
              apellido={ciudadano.apellido}
              fecha_nacimiento={ciudadano.fechaNacimiento}
            />
          </>)
}
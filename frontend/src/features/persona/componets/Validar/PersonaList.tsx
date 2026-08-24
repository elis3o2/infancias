import type { Persona } from "../../types";
import { ListData } from "@/common/components/ListData";


type Props = {
    persona : Persona
}

export const PersonaList = ({ persona }: Props) => {
  return (<>
            <ListData
              nombre={persona.nombre}
              dni={persona.dni}
              sexo={persona.sexo}
              apellido={persona.apellido}
              fecha_nacimiento={persona.fecha_nacimiento}
            />
          </>)
}
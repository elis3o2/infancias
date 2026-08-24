import type { AdolescenteCreate, AdolescenteCrud } from "../../types";
import { ListData } from "@/common/components/ListData";


type Props = {
    adolescente : AdolescenteCreate | AdolescenteCrud
    onEditar?: () => void
}

export const AdolescenteList = ({ adolescente, onEditar }: Props) => {
  if (adolescente.sexo == "") return (<></>)

  return (<>
            <ListData
              nombre={adolescente.nombre}
              apellido={adolescente.apellido}
              sexo={adolescente.sexo}
              dni={adolescente.dni}
              fecha_nacimiento={adolescente.fecha_nacimiento}
              domicilio={adolescente.domicilio?.nombre}
              domicilio_observaciones={adolescente.domicilio?.observaciones == null? undefined : adolescente.domicilio?.observaciones}
              onEditar={onEditar}
            />
          </>)
}
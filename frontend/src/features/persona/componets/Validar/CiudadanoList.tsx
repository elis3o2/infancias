import type { Ciudadano } from "../../types"
import { ListData } from "@/common/components/ListData"

type Props = {
  ciudadano: Ciudadano
}

export const CiudadanoList = ({ ciudadano }: Props) => (
  <ListData
    nombre={ciudadano.nombre}
    apellido={ciudadano.apellido}
    dni={ciudadano.nroDocumento}
    sexo={ciudadano.sexo}
    fecha_nacimiento={ciudadano.fechaNacimiento}
  />
)

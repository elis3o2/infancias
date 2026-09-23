import type { Ciudadano } from "@/features/api_externa/types"
import { ListData } from "@/common/components/ListData"

type Props = {
  ciudadano: Ciudadano
}

export const CiudadanoList = ({ ciudadano }: Props) => (
  <ListData
    nombre={ciudadano.nombre}
    apellido={ciudadano.apellido}
    dni={String(ciudadano.nroDocumento)}
    sexo={ciudadano.sexo}
    fecha_nacimiento={ciudadano.fechaNacimiento}
  />
)

import { InstitucionList } from "./InstitucionList"
import type { Institucion } from "../../types"
import { TitledCard } from "@/common/components/TitleCard"

type Props = {
  institucion: Institucion
}

export const InstitucionCard = ({institucion}: Props) => {
  return (
    <TitledCard
      titulo="Institución solicitante"
      componente={  
        <InstitucionList
          institucion={institucion}
        />}
    />
  )
}
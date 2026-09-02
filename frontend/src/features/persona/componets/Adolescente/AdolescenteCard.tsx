import type { AdolescenteCrud } from "../../types"
import { AdolescenteList } from "./AdolescenteList"
import { TitledCard } from "@/common/components/TitleCard"

type Props = {
  adolescente: AdolescenteCrud
}

export const AdolescenteCard = ({ adolescente }: Props) => {
  return (
    <TitledCard
      titulo="Datos del niño, niña o Adolescente"
      componente={
        <AdolescenteList
          adolescente={adolescente}
        />
      }
    />
  )
}
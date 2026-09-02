import type { Familiar } from "../../types"
import { FamiliaresList } from "./FamiliaresList"
import { TitledCard } from "@/common/components/TitleCard"

type Props = {
  familiares: Familiar[]
}

export const FamiliaresCard = ({ familiares }: Props) => {
  return (
    <TitledCard
      titulo="Familiares / referentes"
      componente={
        <FamiliaresList
          familiares={familiares}
        /> 
      }
    />
  )
}
import type { Hermano } from "./types"
import { TitledCard } from "@/common/components/TitleCard"
import { HermanosList } from "./HermanosList"

type Props = {
  hermanos: Hermano[]
}

export const HermanosCard = ({ hermanos }: Props) => {
  return (
    <TitledCard
      titulo="Hermanos"
      componente={
        <HermanosList
          hermanos={hermanos}
        />
      }
    />
  )
}

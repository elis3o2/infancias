import type { Persona } from "../../types"
import { PersonaList } from "./PersonaList"
import { TitledCard } from "@/common/components/TitleCard"

type Props = {
  persona: Persona
  titulo: string
}

export const PersonaCard = ({persona, titulo}: Props) => {
  return (
    <TitledCard
      titulo={titulo}
      componente={
        <PersonaList
          persona={persona}
        />
      }
    />
  )
}
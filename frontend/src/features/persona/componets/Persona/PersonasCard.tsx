import type { Persona } from "../../types"
import { PersonasList } from "./PersonasList"
import { TitledCard } from "@/common/components/TitleCard"

type Props = {
  personas: Persona[]
  titulo: string
}

export const PersonasCard = ({personas, titulo}: Props) => {
  return (
    <TitledCard
      titulo={titulo}
      componente={
        <PersonasList
          personas={personas}
        />
      }
    />
  )
}
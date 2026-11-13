import { useMemo } from "react"
import type { PersonaCreate } from "../persona/types"
import { aplicarSalud } from "./historiasClinicas"
import { useHistoriasClinicas } from "./useHistoriasClinicas"

export function useSaludPersona(persona: PersonaCreate | null) {
  const historias = useHistoriasClinicas([persona?.hc])
  const consultada = useMemo(() => persona
    ? aplicarSalud(persona, persona.dni, persona.sexo, historias.consultas) : null,
  [persona, historias.consultas])
  return { ...historias, persona: consultada }
}

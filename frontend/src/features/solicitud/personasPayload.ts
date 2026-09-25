import { domicilioFormToDomicilioInput } from "@/features/domicilio/utils"
import { obtenerDatosSalud } from "@/features/persona/salud"
import type { PersonaCreate } from "@/features/persona/types"
import type { FamiliarValidacionInput, PersonaValidacionInput } from "./contracts"

export function personaValidacionInput(persona: PersonaCreate): PersonaValidacionInput {
  const fecha = new Date(persona.fecha_nacimiento)
  if (!persona.nombre.trim() || !persona.apellido.trim() || !persona.dni.trim() || !persona.sexo || Number.isNaN(fecha.getTime())) {
    throw new Error("La persona debe tener nombre, apellido, DNI, sexo y fecha de nacimiento válidos.")
  }
  return {
    nombre: persona.nombre.trim(), apellido: persona.apellido.trim(),
    dni: persona.dni.trim(), sexo: persona.sexo,
    fecha_nacimiento: fecha.toISOString().slice(0, 10),
    ...obtenerDatosSalud(persona),
  }
}

export function familiarValidacionInput(persona: PersonaCreate): Omit<FamiliarValidacionInput, "id"> {
  const vinculo = persona.id_vinculo ?? persona.vinculo?.id
  if (!vinculo) throw new Error("Seleccioná el vínculo con el niña, niño o adolescente.")
  return {
    persona: personaValidacionInput(persona),
    id_vinculo: vinculo,
    telefono: persona.telefono?.trim() || null,
    domicilio: persona.domicilio ? domicilioFormToDomicilioInput(persona.domicilio) : null,
  }
}

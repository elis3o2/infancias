import { domicilioFormToDomicilioInput } from "@/features/domicilio/utils"
import type { PersonaCreate } from "@/features/persona/types"
import { obtenerDatosSalud } from "@/features/persona/salud"
import type { FamiliarValidacionInput, PersonaValidacionInput, SolicitudCrud, SolicitudValidacionInput } from "../../../types"
import type { FamiliarRevision, Revisiones } from "./types"

function personaInput(persona: PersonaCreate): PersonaValidacionInput {
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

function familiarInput(revision: FamiliarRevision): FamiliarValidacionInput {
  const { persona, original } = revision
  if (revision.estado !== "confirmado" || !persona) {
    throw new Error("Confirmá los datos de todos los familiares antes de aceptar la solicitud.")
  }
  const vinculo = persona.id_vinculo ?? persona.vinculo?.id
  if (!vinculo) throw new Error("Seleccioná el vínculo de cada familiar con su adolescente.")
  if (!persona.dni.trim()) throw new Error("Todos los familiares necesitan DNI y sexo para validarse.")
  return {
    ...(original ? { id: original.id } : {}),
    persona: personaInput(persona),
    id_vinculo: vinculo,
    telefono: persona.telefono?.trim() || null,
    domicilio: persona.domicilio ? domicilioFormToDomicilioInput(persona.domicilio) : null,
  }
}

export function crearPayloadValidacion(
  solicitud: SolicitudCrud, revisiones: Revisiones, descripcion: string,
): SolicitudValidacionInput {
  return {
    descripcion_extra: descripcion.trim(),
    adolescentes: solicitud.adolescentes.map((adolescente) => {
      const revision = revisiones[adolescente.id]
      if (revision.estado !== "confirmado" || !revision.persona) {
        throw new Error("Confirmá los datos de todos los adolescentes antes de aceptar la solicitud.")
      }
      const familiares = revision.familiares.map(familiarInput)
      const identidades = familiares.map(({ persona }) => `${persona.dni}-${persona.sexo}`)
      if (new Set(identidades).size !== familiares.length) {
        throw new Error(`Hay un familiar repetido para ${adolescente.nombre} ${adolescente.apellido}.`)
      }
      const legajo = revision.legajoRegistrado ? null : revision.persona.legajo
      if (legajo && Object.values(legajo).some((numero) => numero !== null && (!Number.isInteger(numero) || numero < 1))) {
        throw new Error("Los números de legajo y carpeta deben ser enteros mayores a cero.")
      }
      // Los números de un legajo ya registrado no se reenvían como un legajo externo nuevo.
      return { id: adolescente.id, persona: personaInput(revision.persona), familiares, legajo }
    }),
  }
}

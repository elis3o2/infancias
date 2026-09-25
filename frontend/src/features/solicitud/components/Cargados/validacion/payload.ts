import { familiarValidacionInput, personaValidacionInput } from "../../../personasPayload"
import type { FamiliarValidacionInput, SolicitudCrud, SolicitudValidacionInput } from "../../../types"
import type { FamiliarRevision, Revisiones } from "./types"

function familiarInput(revision: FamiliarRevision): FamiliarValidacionInput {
  const { persona, original } = revision
  if (revision.estado !== "confirmado" || !persona) {
    throw new Error("Confirmá los datos de todos los familiares antes de aceptar la solicitud.")
  }
  return {
    ...(original ? { id: original.id } : {}),
    ...familiarValidacionInput(persona),
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
      return { id: adolescente.id, persona: personaValidacionInput(revision.persona), familiares, legajo }
    }),
  }
}

import { domicilioFormToDomicilioInput } from "@/features/domicilio/utils"
import type { FamiliarValidacionInput, SolicitudCrud, SolicitudValidacionInput } from "../../../types"
import type { FamiliarRevision, Revisiones } from "./types"

function familiarInput(revision: FamiliarRevision): FamiliarValidacionInput {
  const { persona, original, salud } = revision
  if (revision.estado !== "confirmado" || !persona) {
    throw new Error("Confirmá los datos de todos los familiares antes de aceptar la solicitud.")
  }
  const vinculo = persona.id_vinculo ?? persona.vinculo?.id
  if (!vinculo) throw new Error("Seleccioná el vínculo de cada familiar con su adolescente.")
  if (!persona.dni.trim()) throw new Error("Todos los familiares necesitan DNI y sexo para validarse.")
  return {
    ...(original ? { id: original.id } : {}),
    dni: persona.dni.trim(),
    sexo: persona.sexo,
    id_vinculo: vinculo,
    telefono: persona.telefono?.trim() || null,
    domicilio: persona.domicilio ? domicilioFormToDomicilioInput(persona.domicilio) : null,
    salud,
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
      const identidades = familiares.map((familiar) => `${familiar.dni}-${familiar.sexo}`)
      if (new Set(identidades).size !== familiares.length) {
        throw new Error(`Hay un familiar repetido para ${adolescente.nombre} ${adolescente.apellido}.`)
      }
      const legajo = revision.legajoRegistrado ? null : revision.persona.legajo
      if (legajo && Object.values(legajo).some((numero) => numero !== null && (!Number.isInteger(numero) || numero < 1))) {
        throw new Error("Los números de legajo y carpeta deben ser enteros mayores a cero.")
      }
      // Los números de un legajo ya registrado no se reenvían como un legajo externo nuevo.
      return { id: adolescente.id, salud: revision.salud, familiares, legajo }
    }),
  }
}

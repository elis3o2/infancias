import { getCiudadanoData } from "@/features/api_externa/api"
import { ciudadanoToPersona, personaRegistradaAFormulario } from "@/features/persona/utils"
import type { PersonaCreate } from "@/features/persona/types"
import { familiarValidacionInput } from "./personasPayload"
import type { AdolescenteAdmisionInput, FamiliarAdmisionInput } from "./contracts"

export type TipoAltaAdmision = "familiar" | "adolescente"
export type PersonaConsultada = { persona: PersonaCreate; legajoRegistrado: boolean }

export async function consultarPersonaAdmision(
  tipo: TipoAltaAdmision, dni: string, sexo: "M" | "F",
): Promise<PersonaConsultada> {
  const consulta = [{ id: 0, dni, sexo }]
  const adolescente = tipo === "adolescente"
  const respuesta = await getCiudadanoData(adolescente ? consulta : [], adolescente ? [] : consulta)
  const resultado = adolescente ? respuesta.adolescentes[0] : respuesta.familiares[0]
  const persona = resultado?.persona ? personaRegistradaAFormulario(resultado.persona)
    : resultado?.ciudadano ? ciudadanoToPersona(resultado.ciudadano) : null
  if (!persona) throw new Error("No se encontró una persona con ese DNI y sexo.")
  if (persona.dni !== dni || persona.sexo !== sexo) {
    throw new Error("La identidad consultada no coincide con el DNI y sexo ingresados.")
  }
  return {
    persona: adolescente ? persona : { ...persona, legajo: null },
    legajoRegistrado: adolescente && (resultado?.persona?.legajo != null || resultado?.persona?.carpeta != null),
  }
}

export function familiarAdmisionInput(idAdolescente: number, persona: PersonaCreate): FamiliarAdmisionInput {
  if (!Number.isInteger(idAdolescente) || idAdolescente < 1) throw new Error("Seleccioná un niña, niño o adolescente de la solicitud.")
  if (persona.telefono && !/^\d{10}$/.test(persona.telefono.trim())) throw new Error("El teléfono debe tener 10 dígitos.")
  return { id_adolescente: idAdolescente, ...familiarValidacionInput(persona) }
}

export function adolescenteAdmisionInput(
  idAdolescente: number, persona: PersonaCreate, legajoRegistrado: boolean,
): AdolescenteAdmisionInput {
  const datos = familiarAdmisionInput(idAdolescente, persona)
  if (!datos.domicilio) throw new Error("Cargá el domicilio del niña, niño o adolescente antes de guardarlo.")
  const legajo = legajoRegistrado ? null : persona.legajo
  if (legajo && Object.values(legajo).some((numero) => numero !== null && (!Number.isInteger(numero) || numero < 1))) {
    throw new Error("Los números de legajo y carpeta deben ser enteros mayores a cero.")
  }
  return { ...datos, domicilio: datos.domicilio, legajo }
}

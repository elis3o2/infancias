import { esInstitucionExistente, institucionFormToInstitucionInput } from "@/features/domicilio/utils"
import { adolescenteCreateToAdolescenteInput, dniFamiliarEsValido, familiarCreateToFamiliarInput } from "@/features/persona/utils"
import type { AdolescenteSolicitudInput, RelacionAdolescenteInput } from "@/features/solicitud/types"
import type { AdolescenteFormulario } from "./formTypes"
import type { InstitucionFormData } from "@/features/domicilio/types"
import type { InstitucionSolicitudInput } from "@/features/solicitud/contracts"

export function prepararInstitucion(institucion: InstitucionFormData): InstitucionSolicitudInput {
  const input = institucionFormToInstitucionInput(institucion)
  return esInstitucionExistente(input) ? input : { institucion: input }
}

export function errorFamiliaresSolicitud(adolescentes: AdolescenteFormulario[]): string | null {
  const familiares = adolescentes.flatMap((adolescente) => adolescente.familiares)
  if (!familiares.length) return "Agregá al menos un familiar a la solicitud."
  if (familiares.some((familiar) => !dniFamiliarEsValido(familiar.dni))) {
    return "Todos los familiares deben tener un DNI de 7 u 8 dígitos."
  }
  return null
}

export function prepararAdolescentes(adolescentes: AdolescenteFormulario[]): {
  adolescentes: AdolescenteSolicitudInput[]
  relaciones_adolescentes: RelacionAdolescenteInput[]
} {
  if (!adolescentes.length) throw new Error("Agregá al menos un adolescente.")
  const errorFamiliares = errorFamiliaresSolicitud(adolescentes)
  if (errorFamiliares) throw new Error(errorFamiliares)
  const ids = new Set<string>()
  const identidades = new Set<string>()
  const relaciones: RelacionAdolescenteInput[] = []
  const datos = adolescentes.map((adolescente, index): AdolescenteSolicitudInput => {
    const identidad = `${adolescente.datos.dni.trim()}-${adolescente.datos.sexo}`
    if (ids.has(adolescente.id_temp) || identidades.has(identidad)) {
      throw new Error("Hay adolescentes repetidos en el formulario.")
    }
    if (adolescente.familiares.some((familiar) => familiar.dni?.trim() === adolescente.datos.dni.trim() &&
        familiar.sexo === adolescente.datos.sexo)) {
      throw new Error("Un niño, niña o adolescente no puede ser su propio familiar.")
    }
    if (index > 0) {
      if (!adolescente.relacion || !ids.has(adolescente.relacion.id_temp)) {
        throw new Error("Cada niña, niño o adolescente nuevo debe tener vínculo con uno agregado anteriormente.")
      }
      relaciones.push({
        id_temp1: adolescente.id_temp,
        id_temp2: adolescente.relacion.id_temp,
        id_vinculo: adolescente.relacion.vinculo.id,
      })
    }
    ids.add(adolescente.id_temp)
    identidades.add(identidad)
    return {
      ...adolescenteCreateToAdolescenteInput(adolescente.datos),
      id_temp: adolescente.id_temp,
      familiares: adolescente.familiares.map(familiarCreateToFamiliarInput),
      referencias_instituciones_data: adolescente.referencias.map((referencia) => {
        const input = institucionFormToInstitucionInput(referencia)
        return esInstitucionExistente(input) ? { id: input.id_institucion } : { ...input, id_temp: referencia.id_temp }
      }),
    }
  })
  return { adolescentes: datos, relaciones_adolescentes: relaciones }
}

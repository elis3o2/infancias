import http from '@/common/api/client'
import type { Ciudadano, RespCiudadano, Salud, Vinculo } from './types'
import type { Institucion } from '../domicilio/types'

const CIUDADANO_URL = "persona/ciudadano/"
const HISTORIA_CLINICA_URL = "persona/historia-clinica/"

/** @deprecated Use the institution functions from `features/domicilio/api`. */
export const getInstitucion = (): Promise<Institucion[]> =>
  http.get<Institucion[]>("domicilio/institucion/").then((response) => response.data)

export const getVinculos = (): Promise<Vinculo[]> => {
  return http.get<Vinculo[]>('persona/vinculo/').then(res => res.data)
}


export const postAdolescenteValidado = (id_adolescente: number, sexo: "M" | "F", dni: string,
                                        nombre: string, apellido: string, fecha_nacimiento: string) => {
  return http.post("persona/adolescente_validado/", {id_adolescente, sexo, dni, nombre, apellido, fecha_nacimiento}).then((res) => res.data)
}


export const postHermanoValidado = (id_hermano: number, sexo: "M" | "F", dni: string,
                                        nombre: string, apellido: string, fecha_nacimiento: string) => {
  return http.post("persona/hermano_validado/", {id_hermano, sexo, dni, nombre, apellido, fecha_nacimiento}).then((res) => res.data)
}


export const getCiudadanoData = (
    adolescentes: { id: number; sexo: "M" | "F"; dni: string }[],
    familiares: { id: number; sexo: "M" | "F"; dni: string }[]
): Promise<RespCiudadano> => {

    return http.get<RespCiudadano>(
        CIUDADANO_URL,
        {
            params: {
                adolescentes: JSON.stringify(adolescentes),
                familiares: JSON.stringify(familiares),
            },
        }
    ).then(response => response.data)
}

/**
 * Compatibility helper for older validation components. The citizen endpoint
 * is batch-based, so a one-person lookup is expressed through that same
 * contract instead of a non-existent `?dni=...` endpoint.
 */
export const getCiudadano = async (dni: string, sexo: "M" | "F"): Promise<Ciudadano> => {
  const respuesta = await getCiudadanoData([{ id: 0, dni, sexo }], [])
  const ciudadano = respuesta.adolescentes[0]?.ciudadano

  if (!ciudadano) {
    throw new Error("No se encontraron datos en RENAPER.")
  }

  return ciudadano
}

export const getSalud = (dni: string, sexo: string): Promise<Salud> =>
  http
    .get<Salud>(HISTORIA_CLINICA_URL, { params: { dni, sexo } })
    .then((response) => response.data)

import http from '@/common/api/client'
import type { APIGeo1, RespCiudadano, Salud, Ciudadano, Geolocalizacion } from './types'


export const getGeo = (direccion: string) : Promise<APIGeo1[]> => {
    return http.get<APIGeo1[]>(`domicilio/geolocalizacion/features?domicilio=${direccion}`).then(res => res.data)
}

export const getDic = (direccion: string) : Promise<Geolocalizacion[]> => {
    return http.get<Geolocalizacion[]>(`domicilio/geolocalizacion/features?domicilio=${direccion}`).then(res => res.data)
}

export const getCiudadanoData = (
    adolescentes: { id: number; sexo: "M" | "F"; dni: string }[],
    familiares: { id: number; sexo: "M" | "F"; dni: string }[]
): Promise<RespCiudadano> => {

    return http.get<RespCiudadano>(
        "externa/ciudadano/",
        {
            params: {
                adolescentes: JSON.stringify(adolescentes),
                familiares: JSON.stringify(familiares),
            },
        }
    ).then(response => response.data)
}

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
    .get<Salud>("externa/historia-clinica/", { params: { dni, sexo } })
    .then((response) => response.data)

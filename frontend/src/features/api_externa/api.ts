import http from '@/common/api/client'
import type { APIGeo1, RespCiudadano, Ciudadano, Geolocalizacion, HCFResponse } from './types'


export const getGeo = (direccion: string) : Promise<APIGeo1[]> => {
    return http.get<APIGeo1[]>(`domicilio/geolocalizacion/features?domicilio=${direccion}`).then(res => res.data)
}

export const getDic = (direccion: string) : Promise<Geolocalizacion[]> => {
    return http.get<Geolocalizacion[]>(`domicilio/geolocalizacion/features?domicilio=${direccion}`).then(res => res.data)
}

export const getCiudadanoData = (
    adolescentes: { id: number; sexo: "M" | "F"; dni: string }[],
    familiares: { id: number; sexo: "M" | "F"; dni: string }[],
    signal?: AbortSignal,
): Promise<RespCiudadano> => {

    return http.get<RespCiudadano>(
        "persona/ciudadano/",
        {
            signal,
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

export const getHistoriaClinica = (hci: number, signal?: AbortSignal): Promise<HCFResponse | null> =>
  http.get<HCFResponse | null>("externa/historia-clinica/", { params: { hci }, signal })
    .then((response) => response.data || null)

import http from '../../common/api/client'
import type { Ciudadano } from './types'


export const getCiudadano = (dni: string, sexo: string) : Promise<Ciudadano> => {
  return http.get<Ciudadano>(`persona/ciudadano?dni=${dni}&sexo=${sexo}`).then(res => res.data)
}





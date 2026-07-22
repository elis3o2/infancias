import http from '@/common/api/client'
import type { CCB, Ciudadano, Escolaridad, Salud } from './types'
import type { Institucion } from '../domicilio/types'




export const getCiudadano = (dni: string, sexo: string) : Promise<Ciudadano> => {
  return http.get<Ciudadano>(`persona/ciudadano?dni=${dni}&sexo=${sexo}`).then(res => res.data)
}

export const getEscolaridad = (): Promise<Escolaridad[]> =>{
  return http.get<Escolaridad[]>('persona/escolaridad/').then(res => res.data)
}

export const getSalud = (dni: string, sexo: string) : Promise<Salud> => {
  return http.get<Salud>(`persona/historia-clinica?dni=${dni}&sexo=${sexo}`).then(res => res.data)
}


export const getInstitucion = (): Promise<Institucion[]> => {
  return http.get<Institucion[]>('persona/institucion/').then(res => res.data)
}


export const getCCB = (): Promise<CCB[]> => {
  return http.get<CCB[]>('persona/ccb/').then(res => res.data)
}
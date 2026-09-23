import http from '@/common/api/client'
import type { Vinculo } from './types'


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


export const getVinculosAdolescentes = (): Promise<Vinculo[]> => {
  return http.get<Vinculo[]>('persona/vinculo/adolescente/').then(res => res.data)
}
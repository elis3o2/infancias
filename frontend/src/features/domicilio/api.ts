import http from '@/common/api/client'
import type { Departamento, Institucion, Provincia, Referencia, TipoInstitucion } from './types'



export const getTipoInstitucionAll = () : Promise<TipoInstitucion[]> => {
    return http.get<TipoInstitucion[]>(`domicilio/tipo_institucion/`).then(res => res.data)
}

export const getInstitucionByTipo = (id_tipo: number) : Promise<Institucion[]> => {
    return http.get<Institucion[]>(`domicilio/institucion/?id_tipo=${id_tipo}`).then(res => res.data)
}

export const getInstitucionEducacion = () : Promise<Institucion[]> => {
    return http.get<Institucion[]>(`domicilio/institucion/educacion/`).then(res => res.data)
}

export const getInstitucionTerritorial = () : Promise<Institucion[]> => {
    return http.get<Institucion[]>(`domicilio/institucion/territorial/`).then(res => res.data)
}



export const getProvincias = () : Promise<Provincia[]> => {
    return http.get<Provincia[]>(`domicilio/provincia/`).then(res => res.data)
}

export const getDepartamentos = (id_provincia: number) : Promise<Departamento[]> => {
    return http.get<Departamento[]>(`domicilio/departamento/?id_provincia=${id_provincia}`).then(res => res.data)
}
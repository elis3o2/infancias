import http from '@/common/api/client'
import type { Departamento, Geolocalizacion, Institucion, Provincia, Referencia, TipoInstitucion } from './types'

export const getGeo = (direccion: string) : Promise<Geolocalizacion[]> => {
    return http.get<Geolocalizacion[]>(`domicilio/geolocalizacion/features?domicilio=${direccion}`).then(res => res.data)
}

export const getDic = (direccion: string) : Promise<Geolocalizacion[]> => {
    return http.get<Geolocalizacion[]>(`domicilio/geolocalizacion/features?domicilio=${direccion}`).then(res => res.data)
}

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

export const getReferenciaGubernamental = () : Promise<Referencia[]> => {
    return http.get<Referencia[]>(`domicilio/referencia_gubernamental/`).then(res => res.data)
}

export const getReferenciaNoGubernamental = () : Promise<Referencia[]> => {
    return http.get<Referencia[]>(`domicilio/referencia_no_gubernamental/`).then(res => res.data)
}

export const getProvincias = () : Promise<Provincia[]> => {
    return http.get<Provincia[]>(`domicilio/provincia/`).then(res => res.data)
}

export const getDepartamento = (id_provincia: number) : Promise<Departamento[]> => {
    return http.get<Departamento[]>(`domicilio/departamento/?id_provincia=${id_provincia}`).then(res => res.data)
}
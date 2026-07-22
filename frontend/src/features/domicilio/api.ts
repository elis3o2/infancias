import http from '@/common/api/client'
import type { Geolocalizacion, Institucion, TipoInstitucion } from './types'

export const getGeo = (direccion: string) : Promise<Geolocalizacion[]> => {
    return http.get<Geolocalizacion[]>(`domicilio/geolocalizacion/features?domicilio=${direccion}`).then(res => res.data)
}

export const getTipoInstitucionAll = () : Promise<TipoInstitucion[]> => {
    return http.get<TipoInstitucion[]>(`domicilio/tipo_institucion/`).then(res => res.data)
}

export const getInstitucionByTipo = (id_tipo: number) : Promise<Institucion[]> => {
    return http.get<Institucion[]>(`domicilio/institucion/?id_tipo=${id_tipo}`).then(res => res.data)
}
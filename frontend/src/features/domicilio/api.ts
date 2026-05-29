import http from '../../common/api/client'
import type {Geolocalizacion } from './types'

export const getGeo = (direccion: string) => {
    return http.get<Geolocalizacion>(`domicilio/geolocalizacion/features?domicilio=${direccion}`).then(res => res.data)
}
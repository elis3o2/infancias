export type DomicilioValidado = {
    id: number,
    calle: string,
    codigo_calle: number,
    altura: number,
    bis: number,
    letra: string,
    piso: string,
    depto: string,
    monoblock: number,
    barrio: string,
    vecinal: string,
    distrito: string,
    seccion_policial: string,
    localidad: string,
    coordenada_x: string,
    coordenada_y: string,
    fraccion_censal: string,
    readio_censal: string
}


export type Domicilio = {
    id: number,
    nombre: string,
    domicilio_validado: DomicilioValidado
}


export type Geolocalizacion = {
    properties : {
        altura: number
        bis: boolean
        codigoCalle: number
        codigoInterseccion: number | null
        id: string
        letra: string
        name: string
        nombreCalle: string
        nombreInterseccion: string | null
        subtipo: string
    }
    geometry: {coordinates : [number, number]}
}


export type TipoInstitucion = {
    id: number,
    nombre: string
}


export type Institucion = {
    id: number,
    tipo: TipoInstitucion,
    direccion: Domicilio,
    nombre: string
}

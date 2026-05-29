export type Domicilio = {
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


export type TipoEfector = {
    id: number,
    nombre: string
}


export type Efector = {
    id: number,
    tipo: TipoEfector,
    direccion: Domicilio
}


export type Institucion = {
    id: number,
    nombre: string
}
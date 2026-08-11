export type Provincia = {
    id: number,
    nombre: string
}

export type Departamento = {
    id: number
    nombre: string
    provincia: Provincia
}

export type DomicilioValidado = {
    id: number,
    codigo_calle: number,
    altura: number,
    bis: boolean,
    letra: string,
    piso: string,
    depto: string,
    monoblock: number,
    barrio: string,
    vecinal: string,
    distrito: string,
    seccion_policial: string,
    localidad: string,
    coordenada_x: number,
    coordenada_y: number,
    fraccion_censal: string,
    radio_censal: string
}


export type Domicilio = {
    id: number,
    nombre: string,
    domicilio_validado: DomicilioValidado | null
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


export type InstitucionCreate = {
    id_tipo: number
    domicilio: { nombre: string }
    nombre: string
    telefono: string
}


export type Institucion = {
    id: number,
    tipo: TipoInstitucion,
    domicilio: Domicilio,
    nombre: string
    telefono: string
}


export type Referencia = {
    id?: number,
    nombre: string
    telefono: string
    domicilio: Domicilio
}



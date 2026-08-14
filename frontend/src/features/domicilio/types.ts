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
    id?: number,
    nombre: string,
    domicilio_validado: DomicilioValidado | null
    provincia: Provincia
    departamento: Departamento
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



export const InstitucionInicial : Institucion = {
    id: -1,
    tipo: null,
    domicilio: {nombre: "", provincia: null, departamento:null, domicilio_validado: null},
    nombre: "",
    telefono: "",
    correo: ""
}


export type Institucion = {
    id?: number,
    tipo?: TipoInstitucion,
    id_tipo?: number
    domicilio: Domicilio,
    nombre: string
    telefono: string
    correo: string
}


export type Referencia = {
    id?: number,
    nombre: string
    telefono: string
    domicilio: Domicilio
}



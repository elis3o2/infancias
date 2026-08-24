export type Provincia = {
    id: number,
    nombre: string
}

export type Departamento = {
    id: number
    nombre: string
    provincia: Provincia
}

export type APIGeo1 = {
    altura: number | null 
    bis: boolean | null 
    codigoCalle: number
    codigoInterseccion: number | null
    id: string
    letra: string 
    name: string
    nombreCalle: string
    nombreInterseccion: string | null
    coordenada_x: number
    coordenada_y: number
    longitud: number
    latitud: number
}


export type APIGeo2 = {
    distrito: {id: number, nombre: string}
    vecinal: {id: number, nombre: string}
    barrio: {id: number, nombre: string}
    seccional_policial: {id: number, nombre: string}
    fraccion_sensal: number 
    radio_sensal: number 
    identidad_barrial: {id: number, nombre: string}
    localidad: string
    puntoX: number 
    puntoY: number 
}

export type DomicilioValidado = {
    id: number
    codigo_calle: number
    altura: number 
    bis: boolean
    letra: string
    piso: string
    depto: string
    monoblock: string
    coordenada_x: number
    coordenada_y: number
    distrito: {id: number, nombre: string}
    vecinal: {id: number, nombre: string}
    barrio: {id: number, nombre: string}
    seccional_policial: {id: number, nombre: string}
    fraccion_censal: number
    zona_notificacion: number
    radio_censal: number
    identidad_barrial: {id: number, nombre: string}
    localidad: {id: number, nombre: string}
    puntoX: number
    puntoY: number
    latitud: number
    longitud: number
}


export type DomicilioValidadoForm = {
    altura: number | null 
    bis: boolean | null 
    codigoCalle: number
    codigoInterseccion: number | null
    id: string
    letra: string 
    nombreCalle: string
    nombreInterseccion: string | null
    coordenada_x: number
    coordenada_y: number
    longitud: number
    latitud: number
} 


export type Domicilio = {
    id: number,
    nombre: string,
    domicilio_validado: DomicilioValidado | null
    departamento: Departamento
    observaciones: string | null
}


export type DomicilioFormData = {
    nombre: string
    observaciones: string | null
    id_departamento: number | null 
    domicilio_validado: DomicilioValidadoForm | null
}


export type DomicilioInput = {
    nombre: string,
    id_departamento: number
    observaciones: string | null
    domicilio_validado: DomicilioValidadoForm | null
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
    domicilio: Domicilio,
    nombre: string
}


export type InstitucionInput = {
    nombre: string
    id_tipo: number,
    domicilio: DomicilioInput
} | {id_institucion: number}

export type InstitucionFormData = {
    id: number | null 
    nombre: string
    tipo: TipoInstitucion | null
    domicilio: {
        nombre: string
        provincia: Provincia | null
        departamento: Departamento | null
    }
    modo: "seleccionar" | "cargar"
}

export const InstitucionInicial : InstitucionFormData = {
    id: null,
    nombre: "",
    tipo: null,
    domicilio: {nombre: "", provincia: null, departamento: null},
    modo: "seleccionar"
}

export type Referencia = {
    id?: number,
    nombre: string
    telefono: string
    domicilio: Domicilio
}



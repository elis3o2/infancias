import type { SaludConsulta } from "../persona/salud"

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


export type Ciudadano = SaludConsulta & {
    nombre: string
    apellido: string
    departamento?: string
    localidad?: string
    domicilio?: string
    fechaNacimiento: string
    fallecido?: string
    sexo: "M" | "F"
    nroDocumento: string | number
}


export type PersonaResp = SaludConsulta & {
    nombre: string
    apellido: string
    sexo: "M" | "F"
    fecha_nacimiento: string
    dni: string
    legajo: number | null
    carpeta: number | null
}

export type HCFResultado = {
    idPersona: number
    DNI: string
    numeroHCI: number
    apellido: string
    nombre: string
    sexo: "M" | "F"
    fechaNacimiento: string
    flag_discapacidades: 0 | 1
    flag_consumos_problematicos: 0 | 1
    flag_intentos_de_suicidio: 0 | 1
    flag_problemas_socioambientales: 0 | 1
    flag_violencias: 0 | 1
}

export type HCFResponse = { hcf: string; resultados: HCFResultado[] }

/** Miembro adicional obtenido en la segunda etapa de consulta. */
export type PersonaHistoriaFamiliar = HCFResultado & { hcf: string | null }


export type RelacionResp = {
    vinculo: string
    persona: {
        nombre: string
        apellido: string
        dni: string
        sexo: "M" | "F"
    }
}


export type SolicitudResp = {
    id: number
    fecha_creacion: string
    equipo: string
    motivo: string
}


export type AdolescenteResp = {
    id: number
    solicitudes: SolicitudResp[]
    persona: PersonaResp | null
    ciudadano: Ciudadano | null
    relaciones: RelacionResp[]
}


export type FamiliarResp = {
    id: number
    persona: PersonaResp | null
    ciudadano: Ciudadano | null
    /** Present when the lookup service can resolve related people for a relative. */
    relaciones?: RelacionResp[]
    /** Present when the lookup service can resolve prior requests for a relative. */
    solicitudes?: SolicitudResp[]
}


export type RespCiudadano = {
    adolescentes: AdolescenteResp[]
    familiares: FamiliarResp[]
    hcf: PersonaHistoriaFamiliar[]
}

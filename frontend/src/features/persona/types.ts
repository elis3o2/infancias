import type { Domicilio, DomicilioFormData, DomicilioInput, Institucion } from "../domicilio/types"


export type AdolescenteCrud = {
    id: number,
    dni: string,
    sexo: "M" | "F",
    nombre: string,
    apellido: string,
    domicilio: Domicilio,
    fecha_nacimiento: string
    escolarizado: boolean | null
}

export type AdolescenteCreate = {
    dni: string,
    sexo: "M" | "F" | "",
    nombre: string,
    apellido: string,
    domicilio: DomicilioFormData | null,
    fecha_nacimiento: string
    escolarizado: boolean | null
}

export type Adolescente = {
    id: number,
    persona: Persona
    domicilio: Domicilio,
    fecha_nacimiento: string
    escolarizado: boolean | null
    hermanos_validados: Persona[]
    familiares: Familiar[]
    familiares_validados: Persona[]
    referencias_instituciones: Institucion[]
}

export type AdolescenteInput = {
    dni: string,
    sexo: "M" | "F",
    nombre: string,
    apellido: string,
    domicilio: DomicilioInput,
    fecha_nacimiento: string
    escolarizado: boolean | null
}

export type AdolescenteValidado = {
    id: number,
    dni: string,
    sexo: "M" | "F",
    nombre: string,
    apellido: string,
    fecha_nacimiento: string
}

export const AdolescenteInicial : AdolescenteCreate = {
    dni: "",
    sexo: "",
    nombre: "",
    apellido: "",
    domicilio: null,
    fecha_nacimiento: "",
    escolarizado: null,
}

export type AdolescenteWriteInput = {
    adolescente_validado: PersonaCreate
    hermanos_validados: PersonaCreate[]
    familiares_validados: PersonaCreate[]
}

export type Vinculo = {
    id: number,
    nombre: string
}

export type Familiar = {
    id: number
    nombre: string
    apellido: string
    sexo: "M" | "F" 
    vinculo: Vinculo 
    telefono: string | null 
    dni: string | null 
    domicilio: Domicilio | null
    persona?: Persona | null
}

export type FamiliarCreate = {
    nombre: string
    apellido: string
    sexo: "M" | "F" | ""
    vinculo: Vinculo | null
    telefono: string | null 
    dni: string | null 
    domicilio: DomicilioFormData | null
}


export type FamiliarInput = {
    nombre: string
    apellido: string
    sexo: "M" | "F" | null
    id_vinculo: number
    telefono: string | null 
    dni: string | null 
    domicilio: DomicilioFormData | null    
}

export type Hermano = {
    id: number
    dni: string
    sexo: "M" | "F"
    nombre: string
    apellido: string
    fecha_nacimiento: string
}

export type HermanoCreate = {
    dni: string
    sexo: "M" | "F" | ""
    nombre: string
    apellido: string
    fecha_nacimiento: string
}

export type HermanoInput = {
    dni: string
    sexo: "M" | "F"
    nombre: string
    apellido: string
    fecha_nacimiento: string
}


export type Equipo = {
    id: number
    nombre: string
}

export type LegajoInsert = {
    id_insert: number | null
    carpeta_id: number | null
}

/** Forma de legajo que devuelve la API al consultar una Persona ya registrada. */
export type LegajoDetalle = {
    id: number
    id_insert: number | null
    carpeta: {
        id: number
        id_insert: number | null
    } | null
}

/**
 * Persona persistida que entrega el backend. Los datos de contacto son
 * opcionales porque se guardan en historiales separados y no forman parte del
 * serializer básico de Persona.
 */
export type Persona = {
    id: number
    nombre: string,
    apellido: string,
    dni: string
    fecha_nacimiento: string
    sexo: "M" | "F"
    hcf: number | null
    telefono?: string | null
    domicilio?: Domicilio | null
    vinculo?: Vinculo | null
    legajo: LegajoDetalle | null
}

export type PersonaInput = {
    nombre: string,
    apellido: string,
    dni: string
    fecha_nacimiento: string
    sexo: "M" | "F"
    telefono: string | null 
    domicilio: DomicilioFormData | null
    id_vinculo: number | null 
    legajo: LegajoInsert
}


export type PersonaCreate = {
    nombre: string,
    apellido: string,
    dni: string
    fecha_nacimiento: string
    sexo: "M" | "F" 
    telefono: string | null 
    domicilio: DomicilioFormData | null
    vinculo: Vinculo | null
    legajo: LegajoInsert | null
    id_familiar?: number
    id_hermano?: number
    /** Identifies the relationship when this person is being validated as a relative. */
    id_vinculo?: number
}

export type Ciudadano = {
    nombre: string
    apellido: string
    departamento: string
    localidad: string
    domicilio: string
    fechaNacimiento: string
    fallecido: string
    sexo: "M" | "F"
    nroDocumento: string
    hcf: number | null
}

export type Salud = {
    adscripcion: string[]
    efectores: string[]
    obra_social: string[]
}

export type PersonaResp = {
    nombre: string
    apellido: string
    sexo: "M" | "F"
    fecha_nacimiento: string
    dni: string
    legajo: number | null
    carpeta: number | null
    hcf: number | null
}

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
    hcf: unknown[]
}

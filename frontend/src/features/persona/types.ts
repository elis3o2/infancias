import type { Domicilio, DomicilioFormData, DomicilioInput, Institucion, InstitucionFormData, InstitucionInput } from "../domicilio/types"


export type AdolescenteCrud = {
    id: number,
    dni: string,
    sexo: "M" | "F",
    nombre: string,
    apellido: string,
    domicilio: Domicilio,
    fecha_nacimiento: string
    escolarizado: boolean | null
    hermanos: Hermano[]
    familiares: Familiar[]
    referencias_instituciones: Institucion[]
}

export type AdolescenteCreate = {
    dni: string,
    sexo: "M" | "F" | "",
    nombre: string,
    apellido: string,
    domicilio: DomicilioFormData | null,
    fecha_nacimiento: string
    escolarizado: boolean | null
    hermanos: HermanoCreate[]
    familiares: FamiliarCreate[]
    referencias_instituciones_data: InstitucionFormData[]
}

export type Adolescente = {
    id: number,
    persona: Persona
    domicilio: Domicilio,
    fecha_nacimiento: string
    escolarizado: boolean | null
    hermanos: Hermano[]
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
    hermanos: HermanoInput[]
    familiares: FamiliarInput[]
    referencias_instituciones_data: InstitucionInput[]
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
    hermanos: [],
    familiares: [],
    referencias_instituciones_data: []
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
    sexo: "M" | "F" 
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
    letra: "A" | "B" | "C" | null
    carpeta_id: number | null
}

export type Persona = {
    nombre: string,
    apellido: string,
    dni: string
    fecha_nacimiento: string
    sexo: "M" | "F"
    telefono: string | null 
    domicilio: Domicilio | null
    vinculo: Vinculo | null
    legajo: LegajoInsert
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
}


export type Ciudadano = {
    nombre: string,
    apellido: string,
    departamento: string,
    localidad: string,
    domicilio: string,
    fechaNacimiento: string
    fallecido: string
    sexo: "M" | "F"
    nroDocumento: string
}


export type Salud = {
    adscripcion: string[]
    efectores: string[]
    obra_social: string[]
}

import type { Domicilio, DomicilioFormData, DomicilioInput, Institucion, ReferenciaInstitucionInput } from "../domicilio/types"
import type { DatosSalud } from "./salud"


/******************************************
 *          ADOLESCENTE
 ******************************************/

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

export type AdolescenteInput = {
    dni: string,
    sexo: "M" | "F",
    nombre: string,
    apellido: string,
    domicilio: DomicilioInput,
    fecha_nacimiento: string
    escolarizado: boolean | null
    id_temp: string
    familiares: FamiliarInput[]
    referencias_instituciones_data: ReferenciaInstitucionInput[]
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

export type RelacionAdolescenteInput = {
  id_temp1: string
  id_temp2: string
  id_vinculo: number
}

/******************************************
 *          FAMILIAR
 ******************************************/

export type Familiar = {
    id: number
    adolescente?: number | null
    nombre: string
    apellido: string
    sexo: "M" | "F" | null
    vinculo: Vinculo | null
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
    domicilio: DomicilioInput | null
}

/******************************************
 *          OTROS
 ******************************************/

export type Equipo = {
    id: number
    nombre: string
}


export type Vinculo = {
    id: number,
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


/******************************************
 *          PERSONA
 ******************************************/

export type Persona = DatosSalud & {
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


export type PersonaCreate = DatosSalud & {
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
    id_vinculo?: number
}

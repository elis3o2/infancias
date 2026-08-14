import type { Domicilio, Institucion } from "../domicilio/types"

export type Solicitante = {
    id?: number,
    dni: string,
    nombre: string,
    apellido: string
}

export const SolicitanteInicial : Solicitante = {
    dni: "",
    nombre: "",
    apellido: "",
}

export type Adolescente = {
    id: number,
    dni: string,
    sexo: "M" | "F",
    nombre: string,
    apellido: string,
    domicilio: Domicilio,
    fecha_nacimiento: string
    escolarizado: boolean
    hermanos: Hermano[]
    familiares: Familiar[]
    adolescente_validado: AdolescenteValidado | null
    hermanos_validados: Hermano[]
    referencias_instituciones: Institucion[]
}

export type AdolescenteCreate = {
    dni: string,
    sexo: "M" | "F" | "",
    nombre: string,
    apellido: string,
    domicilio: Domicilio | null,
    fecha_nacimiento: string
    escolarizado: boolean
    hermanos: Hermano[]
    familiares: Familiar[]
    referencias_instituciones_data: (Institucion | {id: number})[]
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
    escolarizado: false,
    hermanos: [],
    familiares: [],
    referencias_instituciones_data: []
}

export type Vinculo = {
    id: number,
    nombre: string
}


export type Familiar = {
    id?: number
    nombre: string
    apellido: string
    vinculo: Vinculo
    telefono: string
}


export type Hermano = {
    id?: number
    dni: string
    sexo: "M" | "F"
    nombre: string
    apellido: string
    fecha_nacimiento: string
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

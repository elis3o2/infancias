import type { Domicilio, Institucion } from "../domicilio/types"

export type Solicitante = {
    id?: number,
    dni: string,
    sexo: "M" | "F" | "",
    nombre: string,
    apellido: string,
    telefono: string,
    correo: string
}

export const SolicitanteInicial : Solicitante = {
    dni: "",
    sexo: "",
    nombre: "",
    apellido: "",
    telefono:"",
    correo: ""
}

export type Adolescente = {
    id?: number,
    dni: string,
    sexo: "M" | "F" | "",
    nombre: string,
    apellido: string,
    domicilio: Domicilio | null,
    fecha_nacimiento: string
    escolarizado: boolean
    hermanos: Hermano[]
    familiares: Familiar[]
    redes: Institucion[]
}

export const AdolescenteInicial : Adolescente = {
    dni: "",
    sexo: "",
    nombre: "",
    apellido: "",
    domicilio: null,
    fecha_nacimiento: "",
    escolarizado: false,
    hermanos: [],
    familiares: [],
    redes: []
}

export type Vinculo = {
    id: number,
    nombre: string
}


export type Familiar = {
    id?: null
    nombre: string
    apellido: string
    id_vinculo?: number
    vinculo?: Vinculo
    telefono: string
}


export type Hermano = {
    id?: null
    dni: string
    sexo: "M" | "F"
    nombre: string
    apellido: string
    fecha_nacimiento: string
}


export type Ciudadano = {
    nombre: string,
    apellido: string,
    dni: string,
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

import type { Domicilio, Institucion } from "../domicilio/types"

export type Solicitante = {
    id: number | null,
    dni: string,
    sexo: "M" | "F",
    nombre: string,
    apellido: string,
    telefono: string,
    correo: string
}


export type Escolaridad = {
    id: number,
    nombre: string
}


export type CCB = {
    id: number,
    nombre: string
}


export type ObraSocial = {
    id: number,
    nombre: string
}


export type Adolescente = {
    id: number | null,
    dni: string,
    sexo: "M" | "F",
    nombre: string,
    apellido: string,
    domicilio: Domicilio,
    fecha_nacimiento: string
    escolarizado: boolean
    redes: Institucion[]
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


export type DatosProgenitor = {
  persona: Persona | null
  vivo: boolean
  convive: boolean
}
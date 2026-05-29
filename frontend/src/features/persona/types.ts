import type { Domicilio, Efector } from "../domicilio/types"

export type Persona = {
    id: number,
    nombre: string,
    apellido: string,
    domicilio: Domicilio
    telefono: string,
    fecha_nacimiento: string
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


export type Menor = {
    id: number,
    persona: Persona,
    escolaridad_actual: boolean,
    escolaridad: Escolaridad,
    efector_rer: Efector,
    ccb_ref: CCB,
    obra_social: ObraSocial
}



export type Ciudadano = {
    nombre: string,
    apellido: string,
    departamento: string,
    domicilio: string,
    fechaNacimiento: string
    fallecido: string
}
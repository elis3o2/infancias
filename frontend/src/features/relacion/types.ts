import type { Menor, Persona } from "../persona/types"

export type Instruccion = {
    id: number,
    nombre: string
}

export type Ocupacion = {
    id: number,
    nombre: string
}


export type TipoRelacion = {
    id: number,
    nombre: string
}

export type Relacion = {
    id: number,
    menor: Menor,
    familiar: Persona,
    tipo: TipoRelacion,
    convive: boolean,
    instruccion: Instruccion,
    ocupacion: Ocupacion
}
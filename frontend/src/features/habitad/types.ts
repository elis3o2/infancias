import type { Domicilio } from "../domicilio/types"

export type Tenencia = {
    id: number,
    nombre: string
}

export type Material = {
    id: number,
    nombre: string
}

export type Habitat = {
    id: number,
    domicilio: Domicilio,
    exclisividad_terreno: boolean,
    exclusividad_vivienda: boolean,
    tenencia: Tenencia,
    material_pared: Material,
    material_techo: Material,
    material_pido: Material,
    agua_corriente: boolean,
    instalacion_electrica: boolean
}
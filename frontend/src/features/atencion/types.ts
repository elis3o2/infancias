import type { Institucion } from "../domicilio/types"
import type { GrupoFamiliar } from "../grupo_familiar/types"
import type { Habitat } from "../habitat/types"
import type { Menor } from "../persona/types"

export type Atencion = {
    id: number,
    institucion: Institucion,
    fecha_hora_creacion: string,
    menor: Menor,
    habitat: Habitat,
    grupos_familiares: GrupoFamiliar[]
}


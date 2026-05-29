
export type Comedor = {
    id: number,
    nombre: string
}


export type TUC = {
    id: number,
    nombre: string
}

export type AUH = {
    id: number,
    nombre: string
}

export type PensionContributica = {
    id: number,
    nombre: string
}


export type PensionNoContributica = {
    id: number,
    nombre: string
}


export type Programa = {
    id: number,
    nombre: string,
}


export type GrupoFamiliar = {
    id: number,
    comedor: Comedor,
    tuc: TUC,
    auh: AUH,
    pension_cont: PensionContributica,
    pension_no_cont: PensionNoContributica,
    programa: Programa
}


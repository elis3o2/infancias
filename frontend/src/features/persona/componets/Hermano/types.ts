import type { AdolescenteCreate, AdolescenteCrud } from "../../types"

// Contratos locales para conservar los componentes anteriores de hermanos.
export type HermanoCreate = Pick<
  AdolescenteCreate,
  "nombre" | "apellido" | "dni" | "sexo" | "fecha_nacimiento"
>

export type Hermano = Pick<
  AdolescenteCrud,
  "id" | "nombre" | "apellido" | "dni" | "sexo" | "fecha_nacimiento"
>

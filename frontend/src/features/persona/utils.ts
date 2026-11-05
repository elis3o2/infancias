import type {
  AdolescenteCreate,
  AdolescenteInput,
  AdolescenteWriteInput,
  FamiliarCreate,
  FamiliarInput,
  PersonaCreate,
} from "./types";
import type { Ciudadano, PersonaResp } from "@/features/api_externa/types"
import { obtenerDatosSalud } from "./salud"
import { domicilioFormToDomicilioInput } from "../domicilio/utils";

export function correoEsValido(correo: string) : boolean {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return correo.trim() !== "" && EMAIL_REGEX.test(correo.trim())
}

function sexoFormToSexoInput(sexo: "M" | "F" | ""): "M" | "F" {
  if (sexo === "") {
    throw new Error("El sexo es obligatorio");
  }
  return sexo;
}


export function dniFamiliarEsValido(dni: string | null | undefined): boolean {
  return /^[0-9]{7,8}$/.test(dni?.trim() ?? "")
}

export function familiarCreateToFamiliarInput(familiar: FamiliarCreate): FamiliarInput {
  if (!dniFamiliarEsValido(familiar.dni)) {
    throw new Error("Todos los familiares deben tener un DNI de 7 u 8 dígitos.");
  }
  if (familiar.vinculo == null) {
    throw new Error("El vínculo es obligatorio");
  }

  return {
    nombre: familiar.nombre,
    apellido: familiar.apellido,
    sexo: familiar.sexo === "" ? null : familiar.sexo,
    id_vinculo: familiar.vinculo.id,
    telefono: familiar.telefono,
    dni: familiar.dni.trim(),
    domicilio: familiar.domicilio
      ? domicilioFormToDomicilioInput(familiar.domicilio)
      : null,
  };
}

export function adolescenteCreateToAdolescenteInput(adolescente: AdolescenteCreate):
  Omit<AdolescenteInput, "id_temp" | "familiares" | "referencias_instituciones_data"> {

  if (adolescente.domicilio == null) {
    throw new Error("El domicilio es obligatorio");
  }

  return {
    dni: adolescente.dni,
    sexo: sexoFormToSexoInput(adolescente.sexo),
    nombre: adolescente.nombre,
    apellido: adolescente.apellido,
    domicilio: domicilioFormToDomicilioInput(adolescente.domicilio),
    fecha_nacimiento: adolescente.fecha_nacimiento,
    escolarizado: adolescente.escolarizado,
  };
}



export function ciudadanoToPersona(ciudadano: Ciudadano): PersonaCreate {
  return{
    ...obtenerDatosSalud(ciudadano),
    dni: String(ciudadano.nroDocumento),
    sexo: ciudadano.sexo,
    nombre: ciudadano.nombre,
    apellido: ciudadano.apellido,
    fecha_nacimiento: ciudadano.fechaNacimiento,
    telefono: null,
    vinculo: null,
    domicilio: null,
    legajo: null
  }
}

export function personaRegistradaAFormulario(persona: PersonaResp): PersonaCreate {
  return {
    ...obtenerDatosSalud(persona),
    nombre: persona.nombre, apellido: persona.apellido, dni: persona.dni,
    sexo: persona.sexo, fecha_nacimiento: persona.fecha_nacimiento,
    telefono: null, domicilio: null, vinculo: null,
    legajo: persona.legajo !== null || persona.carpeta !== null
      ? { id_insert: persona.legajo, carpeta_id: persona.carpeta } : null,
  }
}


export function formAdolescenteWrite(
  adolescente: PersonaCreate,
  hermanos: PersonaCreate[],
  hermanos_nuevos: PersonaCreate[],
  familiares: PersonaCreate[],
  familiaresNuevos: PersonaCreate[]
): AdolescenteWriteInput {

  const formatearFecha = (fecha: string): string =>
    new Date(fecha).toISOString().split("T")[0]

  const transformarPersona = (persona: PersonaCreate): PersonaCreate => ({
    ...persona,
    fecha_nacimiento: formatearFecha(persona.fecha_nacimiento),
  })

  return {
    adolescente_validado: transformarPersona(adolescente),

    hermanos_validados: [
      ...hermanos.map(transformarPersona),
      ...hermanos_nuevos.map(transformarPersona),
    ],

    familiares_validados: [
      ...familiares.map(transformarPersona),
      ...familiaresNuevos.map(transformarPersona),
    ],
  }
}

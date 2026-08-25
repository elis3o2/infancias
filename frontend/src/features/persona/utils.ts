import type {
  AdolescenteCreate,
  AdolescenteInput,
  AdolescenteWriteInput,
  Ciudadano,
  FamiliarCreate,
  FamiliarInput,
  HermanoCreate,
  HermanoInput,
  Persona,
  PersonaCreate,
} from "./types";
import { domicilioFormToDomicilioInput, institucionFormToInstitucionInput } from "../domicilio/utils";

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

export function hermanoCreateToHermanoInput(hermano: HermanoCreate): HermanoInput {
  return {
    dni: hermano.dni,
    sexo: sexoFormToSexoInput(hermano.sexo),
    nombre: hermano.nombre,
    apellido: hermano.apellido,
    fecha_nacimiento: hermano.fecha_nacimiento,
  };
}

export function familiarCreateToFamiliarInput(familiar: FamiliarCreate): FamiliarInput {
  if (familiar.vinculo == null) {
    throw new Error("El vínculo es obligatorio");
  }

  return {
    nombre: familiar.nombre,
    apellido: familiar.apellido,
    sexo: sexoFormToSexoInput(familiar.sexo),
    id_vinculo: familiar.vinculo.id,
    telefono: familiar.telefono,
    dni: familiar.dni,
    domicilio: familiar.domicilio
      ? domicilioFormToDomicilioInput(familiar.domicilio)
      : null,
  };
}

export function adolescenteCreateToAdolescenteInput(adolescente: AdolescenteCreate): AdolescenteInput {

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
    hermanos: adolescente.hermanos.map(hermanoCreateToHermanoInput),
    familiares: adolescente.familiares.map(familiarCreateToFamiliarInput),
    referencias_instituciones_data:
      adolescente.referencias_instituciones_data.map(
        institucionFormToInstitucionInput
      ),
  };
}



export function ciudadanoToPersona(ciudadano: Ciudadano): PersonaCreate {
  return{
    dni: ciudadano.nroDocumento,
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
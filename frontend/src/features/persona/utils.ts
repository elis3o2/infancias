import type {
  AdolescenteCreate,
  AdolescenteInput,
  FamiliarCreate,
  FamiliarInput,
  HermanoCreate,
  HermanoInput,
} from "./types";
import { domicilioFormToDomicilioInput, institucionFormToInstitucionInput } from "../domicilio/utils";

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
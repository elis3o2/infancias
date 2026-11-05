import type { Domicilio, DomicilioFormData, DomicilioInput, InstitucionFormData, InstitucionInput } from "./types";


export function esInstitucionExistente(institucion: InstitucionInput):
    institucion is { id_institucion: number } {
        return "id_institucion" in institucion;
}


export function institucionFormToInstitucionInput(institucion: InstitucionFormData): InstitucionInput {
  if (institucion.tipo == null) {
    throw new Error("El tipo de institución es obligatorio");
  }

  if (institucion.modo === "seleccionar") {
    if (institucion.id == null) {
      throw new Error("Debe seleccionar una institución");
    }
    return { id_institucion: institucion.id };
  }

  // modo === "cargar"
  if (institucion.domicilio.departamento == null) {
    throw new Error("El departamento del domicilio es obligatorio");
  }

  return {
    nombre: institucion.nombre,
    id_tipo: institucion.tipo.id,
    domicilio: domicilioFormToDomicilioInput({
      nombre: institucion.domicilio.nombre,
      observaciones: null,
      id_departamento: institucion.domicilio.departamento.id,
      domicilio_validado: null,
    }),
  };
}




export function domicilioFormToDomicilioInput(domicilio: DomicilioFormData): DomicilioInput {
  if (domicilio.id_departamento == null) {
    throw new Error("El departamento es obligatorio");
  }

  return {
    nombre: domicilio.nombre,
    id_departamento: domicilio.id_departamento,
    observaciones: domicilio.observaciones,
    domicilio_validado: domicilio.domicilio_validado,
  };
}

export function domicilioToFormData ( domicilio: Domicilio | null): DomicilioFormData | null {
    if (!domicilio) {
        return null
    }

    return {
        nombre: domicilio.nombre,
        observaciones: domicilio.observaciones,
        id_departamento: domicilio.departamento?.id ?? null,
        domicilio_validado: null,
    }
}

export function editarDomicilioManual(domicilio: DomicilioFormData | null, cambios: Partial<DomicilioFormData>): DomicilioFormData {
    const anterior: DomicilioFormData = domicilio ?? {
        nombre: "", observaciones: null, id_departamento: null, domicilio_validado: null,
    }
    const siguiente = { ...anterior, ...cambios }
    if (siguiente.nombre !== anterior.nombre || siguiente.id_departamento !== anterior.id_departamento) {
        siguiente.domicilio_validado = null
    }
    return siguiente
}

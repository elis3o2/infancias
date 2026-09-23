import type { AdolescenteFormulario, ReferenciaFormulario } from "./formTypes"

export const claveReferencia = (referencia: ReferenciaFormulario) => referencia.modo === "seleccionar"
  ? `institucion-${referencia.id}`
  : referencia.id_temp ?? JSON.stringify([referencia.tipo?.id, referencia.nombre, referencia.domicilio])

export function agruparReferencias(adolescentes: AdolescenteFormulario[]) {
  const grupos = new Map<string, { clave: string; institucion: ReferenciaFormulario; adolescentes: string[] }>()
  for (const adolescente of adolescentes) {
    for (const institucion of adolescente.referencias) {
      const clave = claveReferencia(institucion)
      const grupo = grupos.get(clave) ?? { clave, institucion, adolescentes: [] }
      if (!grupo.adolescentes.includes(adolescente.id_temp)) grupo.adolescentes.push(adolescente.id_temp)
      grupos.set(clave, grupo)
    }
  }
  return [...grupos.values()]
}

export function guardarReferencia(
  adolescentes: AdolescenteFormulario[], institucion: ReferenciaFormulario,
  seleccionados: string[], anterior?: string,
): AdolescenteFormulario[] {
  if (!seleccionados.length) throw new Error("Elegí al menos un adolescente para esta institución.")
  if (seleccionados.some((id) => !adolescentes.some((item) => item.id_temp === id))) {
    throw new Error("Uno de los adolescentes seleccionados ya no está en el formulario.")
  }
  const clave = claveReferencia(institucion)
  if (clave !== anterior && agruparReferencias(adolescentes).some((item) => item.clave === clave)) {
    throw new Error("Esta institución ya está agregada. Usá Editar vínculos para cambiar sus adolescentes.")
  }
  return adolescentes.map((adolescente) => {
    const referencias = adolescente.referencias.filter((item) => claveReferencia(item) !== anterior)
    return { ...adolescente, referencias: seleccionados.includes(adolescente.id_temp)
      ? [...referencias, institucion] : referencias }
  })
}

export const quitarReferencia = (adolescentes: AdolescenteFormulario[], clave: string) =>
  adolescentes.map((adolescente) => ({ ...adolescente,
    referencias: adolescente.referencias.filter((referencia) => claveReferencia(referencia) !== clave),
  }))

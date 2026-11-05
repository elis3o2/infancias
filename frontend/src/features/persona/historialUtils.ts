import type { FiltrosHistorial, IntervencionHistorial, SolicitudHistorial } from './historialTypes'

export function leerFiltrosHistorial(params: URLSearchParams): FiltrosHistorial {
  return { nombre: params.get('nombre') ?? '', apellido: params.get('apellido') ?? '',
    dni: params.get('dni') ?? '', legajo: params.get('legajo') ?? '' }
}

export function prepararBusquedaHistorial(filtros: FiltrosHistorial): Partial<FiltrosHistorial> {
  const resultado: Partial<FiltrosHistorial> = {}
  for (const campo of ['nombre', 'apellido', 'dni', 'legajo'] as const) {
    const valor = filtros[campo].trim()
    if (valor) resultado[campo] = valor
  }
  if (!Object.keys(resultado).length) throw new Error('Ingresá nombre, apellido, DNI o número de legajo para buscar.')
  for (const campo of ['nombre', 'apellido'] as const) {
    const valor = resultado[campo]
    if (valor && (valor.length < 2 || valor.length > 64)) throw new Error('Nombre y apellido deben tener entre 2 y 64 caracteres.')
  }
  if (resultado.dni && !/^[0-9]{7,9}$/.test(resultado.dni)) throw new Error('El DNI debe tener entre 7 y 9 dígitos, sin puntos.')
  if (resultado.legajo && (!/^[0-9]+$/.test(resultado.legajo) || Number(resultado.legajo) < 1 || Number(resultado.legajo) > 2147483647)) {
    throw new Error('Ingresá un número de legajo válido, sin letras.')
  }
  return resultado
}

export function intervencionesDelHistorial(solicitudes: SolicitudHistorial[]): IntervencionHistorial[] {
  return solicitudes.flatMap((solicitud) => solicitud.comentarios.map((comentario) => ({
    ...comentario, solicitud: solicitud.id, motivo: solicitud.motivo, equipo: solicitud.equipo,
  }))).sort((a, b) => Date.parse(b.fecha_hora_creacion) - Date.parse(a.fecha_hora_creacion) || b.id - a.id)
}

export function estadoSolicitudHistorial(solicitud: SolicitudHistorial) {
  if (solicitud.rechazado) return { texto: 'Rechazada', color: 'error' as const }
  if (solicitud.validado) return { texto: 'Validada', color: 'success' as const }
  return { texto: 'Pendiente', color: 'warning' as const }
}

export function fechaHistorial(valor: string): string {
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? valor : new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short', timeStyle: 'short',
  }).format(fecha)
}

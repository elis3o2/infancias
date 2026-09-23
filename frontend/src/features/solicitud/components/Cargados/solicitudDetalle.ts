import type { Familiar } from "@/features/persona/types"
import type { AdolescenteSolicitud, SolicitudDetalle } from "../../types"

export const familiaresDelAdolescente = (
  adolescente: AdolescenteSolicitud,
  familiaresSolicitud: Familiar[] = [],
): Familiar[] => {
  const familiares = new Map(
    (adolescente.familiares ?? []).map((familiar) => [familiar.id, familiar]),
  )

  for (const familiar of familiaresSolicitud) {
    if (familiar.adolescente === adolescente.id && !familiares.has(familiar.id)) {
      familiares.set(familiar.id, familiar)
    }
  }

  return [...familiares.values()]
}

export const datosSinAdolescente = (solicitud: SolicitudDetalle) => {
  const adolescentes = solicitud.adolescentes ?? []
  const familiaresAsociados = adolescentes.flatMap((adolescente) =>
    familiaresDelAdolescente(adolescente, solicitud.familiares ?? []),
  )
  const idsFamiliares = new Set(familiaresAsociados.map((familiar) => familiar.id))
  const idsPersonas = new Set(
    [...familiaresAsociados, ...(solicitud.familiares ?? [])]
      .flatMap((familiar) => familiar.persona ? [familiar.persona.id] : []),
  )
  const idsReferencias = new Set(adolescentes.flatMap((adolescente) =>
    (adolescente.referencias_instituciones ?? []).map((institucion) => institucion.id),
  ))

  return {
    familiares: (solicitud.familiares ?? []).filter((familiar) => !idsFamiliares.has(familiar.id)),
    personas: (solicitud.familiares_validados ?? []).filter((persona) => !idsPersonas.has(persona.id)),
    referencias: (solicitud.referencias_instituciones ?? []).filter((institucion) =>
      !idsReferencias.has(institucion.id),
    ),
  }
}

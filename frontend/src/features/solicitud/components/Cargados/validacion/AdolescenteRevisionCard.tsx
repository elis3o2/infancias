import { Alert, Box, Divider, Stack, Typography } from "@mui/material"
import { InstitucionesList } from "@/features/domicilio/components/Institucion/InstitucionesList"
import { ValidarAdolescente } from "@/features/persona/componets/Validar/ValidarAdolescente"
import { LegajoForm } from "@/features/persona/componets/Validar/LegajoForm"
import type { AdolescenteResp, FamiliarResp } from "@/features/api_externa/types"
import type { AdolescenteSolicitud } from "../../../types"
import { FamiliarRevisionCard } from "./FamiliarRevisionCard"
import { SaludValidacionForm } from "./SaludValidacionForm"
import type { AdolescenteRevision, CambioRevision, FamiliarRevision } from "./types"

type Props = {
  adolescente: AdolescenteSolicitud
  revision: AdolescenteRevision
  resultado: AdolescenteResp | null
  resultadosFamiliares: FamiliarResp[]
  busquedaRealizada: boolean
  onChange: (cambios: CambioRevision) => void
}

export function AdolescenteRevisionCard({ adolescente, revision, resultado, resultadosFamiliares, busquedaRealizada, onChange }: Props) {
  const actualizarLegajo = (cambios: { id_insert?: number | null; carpeta_id?: number | null } | null) => {
    onChange((prev) => ({ persona: prev.persona ? { ...prev.persona, legajo: cambios === null ? null : {
      id_insert: prev.persona.legajo?.id_insert ?? null, carpeta_id: prev.persona.legajo?.carpeta_id ?? null, ...cambios,
    } } : null }))
  }
  const cambiarFamiliar = (index: number, cambios: Partial<FamiliarRevision>) => onChange((prev) => ({
    familiares: prev.familiares.map((familiar, posicion) => posicion === index ? { ...familiar, ...cambios } : familiar),
  }))
  return (
    <Stack spacing={2.5} sx={{ p: { xs: 1.5, sm: 3 }, border: "1px solid", borderColor: "divider", borderRadius: 3, minWidth: 0 }}>
      <Typography variant="h6">{adolescente.nombre} {adolescente.apellido}</Typography>
      <ValidarAdolescente adolescente={adolescente} estado={revision.estado}
        setEstado={(estado) => onChange({ estado })} persona={revision.persona}
        setPersona={(persona) => onChange({ persona, legajoRegistrado: resultado?.persona?.legajo != null || resultado?.persona?.carpeta != null })}
        personaresp={resultado?.persona ?? null} ciudadano={resultado?.ciudadano ?? null}
        relaciones={resultado?.relaciones ?? []} solicitudes={resultado?.solicitudes ?? []}
        sinResultados={busquedaRealizada && !resultado?.persona && !resultado?.ciudadano} />
      {revision.estado === "confirmado" && (
        <SaludValidacionForm salud={revision.salud} onChange={(salud) => onChange({ salud })} />
      )}
      {revision.estado === "confirmado" && resultado?.persona && !revision.legajoRegistrado && (
        <LegajoForm tieneLegajo={revision.persona?.legajo != null}
          setTieneLegajo={(valor) => actualizarLegajo(valor ? {} : null)}
          legajo={revision.persona?.legajo?.id_insert ?? null} setLegajo={(id_insert) => actualizarLegajo({ id_insert })}
          carpeta={revision.persona?.legajo?.carpeta_id ?? null} setCarpeta={(carpeta_id) => actualizarLegajo({ carpeta_id })} />
      )}
      {(adolescente.referencias_instituciones ?? []).length > 0 && (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Instituciones de referencia</Typography>
          <InstitucionesList instituciones={adolescente.referencias_instituciones} />
        </Box>
      )}
      <Divider />
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Familiares y referentes de {adolescente.nombre}</Typography>
      {revision.familiares.length === 0 && <Alert severity="info">No hay familiares asociados a este adolescente.</Alert>}
      {revision.familiares.map((familiar, index) => (
        <FamiliarRevisionCard key={familiar.original ? `original-${familiar.original.id}` : `nuevo-${familiar.persona?.dni}-${familiar.persona?.sexo}`}
          revision={familiar} resultado={resultadosFamiliares.find((item) => item.id === familiar.original?.id) ?? null}
          busquedaRealizada={busquedaRealizada} onChange={(cambios) => cambiarFamiliar(index, cambios)}
          onEliminar={() => onChange((prev) => ({ familiares: prev.familiares.filter((_, posicion) => posicion !== index) }))} />
      ))}
    </Stack>
  )
}

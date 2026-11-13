import { Stack, Typography } from "@mui/material"
import { TitledCard } from "@/common/components/TitleCard"
import type { PersonaHistoriaFamiliar } from "@/features/api_externa/types"
import { DatosSalud } from "@/features/persona/componets/DatosSalud"

export function HistoriaClinicaCard({ respuestas, pendiente = false }: { respuestas: PersonaHistoriaFamiliar[]; pendiente?: boolean }) {
  return <TitledCard titulo="Personas de la historia clínica familiar" componente={
    respuestas.length === 0 ? <Typography color="text.secondary">{pendiente
      ? "Los integrantes se mostrarán cuando finalice la consulta de historias clínicas."
      : "No se encontraron integrantes adicionales en las historias clínicas consultadas."}</Typography> : (
      <Stack spacing={2}>
        {respuestas.map((persona) => <Stack key={persona.numeroHCI} spacing={1}>
          <Typography><strong>{persona.nombre} {persona.apellido}</strong> — DNI {persona.DNI} — Sexo {persona.sexo}</Typography>
          <DatosSalud persona={{
            hc: persona.numeroHCI,
            hcf: persona.hcf,
            discapacidades: persona.flag_discapacidades,
            consumos_problematicos: persona.flag_consumos_problematicos,
            intentos_de_suicidio: persona.flag_intentos_de_suicidio,
            problemas_socioambientales: persona.flag_problemas_socioambientales,
            violencias: persona.flag_violencias,
          }} />
        </Stack>)}
      </Stack>
    )
  } />
}

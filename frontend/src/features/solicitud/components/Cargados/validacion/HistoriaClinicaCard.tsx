import { Stack, Typography } from "@mui/material"
import { TitledCard } from "@/common/components/TitleCard"
import type { PersonaHistoriaFamiliar } from "@/features/api_externa/types"
import { DatosSalud } from "@/features/persona/componets/DatosSalud"
import { AgregarFamiliarHistoria, type AltaFamiliarHistoria } from "./AgregarFamiliarHistoria"
import { saludDesdeHistoria } from "./familiaresHistoria"
import { formatFecha } from "@/common/fechas"

type Props = { respuestas: PersonaHistoriaFamiliar[]; pendiente?: boolean; altaFamiliar?: AltaFamiliarHistoria }

export function HistoriaClinicaCard({ respuestas, pendiente = false, altaFamiliar }: Props) {
  return <TitledCard titulo="Personas de la historia clínica familiar" componente={
    respuestas.length === 0 ? <Typography color="text.secondary">{pendiente
      ? "Los integrantes se mostrarán cuando finalice la consulta de historias clínicas."
      : "No se encontraron integrantes adicionales en las historias clínicas consultadas."}</Typography> : (
      <Stack spacing={2}>
        {respuestas.map((persona) => <Stack key={persona.numeroHCI} spacing={1}
          sx={{ p: { xs: 1.5, sm: 2 }, border: "1px solid", borderColor: "divider", borderRadius: 2, minWidth: 0 }}>
          <Typography><strong>{persona.nombre} {persona.apellido}</strong> — DNI {persona.DNI} — Sexo {persona.sexo}</Typography>
          <Typography variant="body2" color="text.secondary">Fecha de nacimiento: {formatFecha(persona.fechaNacimiento)}</Typography>
          <DatosSalud persona={saludDesdeHistoria(persona)} />
          {altaFamiliar && <AgregarFamiliarHistoria integrante={persona} {...altaFamiliar} />}
        </Stack>)}
      </Stack>
    )
  } />
}

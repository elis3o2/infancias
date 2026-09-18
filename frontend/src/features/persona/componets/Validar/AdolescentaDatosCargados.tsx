import type { PersonaResp, RelacionResp, SolicitudResp } from "../../types"
import { Box, Chip, Stack, Typography } from "@mui/material"
import { TitledCard } from "@/common/components/TitleCard"
import { formatFecha } from "@/common/utils"

type Props = {
  solicitudes: SolicitudResp[]
  persona: PersonaResp
  relaciones: RelacionResp[]
}

export const AdolescenteDatosCargados = ({ solicitudes, persona,relaciones }: Props) => {
  const datos = [
    ["Nombre", persona.nombre],
    ["Apellido", persona.apellido],
    ["DNI", persona.dni],
    ["Sexo", persona.sexo],
    ["Fecha de nacimiento", formatFecha(persona.fecha_nacimiento)],
    ["Legajo", persona.legajo ?? "—"],
    ["Carpeta", persona.carpeta ?? "—"],
    ["HCF", persona.hcf ?? "—"],
  ]

  return (
    <Stack spacing={2}>
      <TitledCard
        titulo="Persona encontrada en el sistema"
        componente={
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              gap: 1.25,
            }}
          >
            {datos.map(([etiqueta, valor]) => (
              <Box key={etiqueta} sx={{ p: 1.25, borderRadius: 2, bgcolor: "action.hover" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {etiqueta}
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>{valor}</Typography>
              </Box>
            ))}
          </Box>
        }
      />

      <TitledCard
        titulo="Relaciones"
        componente={
          relaciones.length === 0 ? (
            <Typography color="text.secondary">No hay relaciones registradas.</Typography>
          ) : (
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              {relaciones.map((relacion, index) => (
                <Chip
                  key={`${relacion.persona.dni}-${index}`}
                  label={`${relacion.vinculo}: ${relacion.persona.nombre} ${relacion.persona.apellido}`}
                  variant="outlined"
                  sx={{ justifyContent: "flex-start" }}
                />
              ))}
            </Stack>
          )
        }
      />

      <TitledCard
        titulo="Solicitudes anteriores"
        componente={
          solicitudes.length === 0 ? (
            <Typography color="text.secondary">No hay solicitudes anteriores.</Typography>
          ) : (
            <Stack spacing={1}>
              {solicitudes.map((solicitud) => (
                <Box key={solicitud.id} sx={{ p: 1.25, borderLeft: "3px solid", borderColor: "primary.main", bgcolor: "action.hover", borderRadius: "0 8px 8px 0" }}>
                  <Typography sx={{ fontWeight: 700 }}>Solicitud #{solicitud.id}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {solicitud.motivo} · {formatFecha(solicitud.fecha_creacion)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )
        }
      />
    </Stack>
  )
}

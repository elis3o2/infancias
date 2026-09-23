import { Box, Chip, Stack, Typography } from "@mui/material"
import type { PersonaResp, RelacionResp } from "@/features/api_externa/types"
import { formatFecha } from "@/common/utils"

export const DatosPersonaEncontrada = ({ persona, relaciones = [] }: { persona: PersonaResp; relaciones?: RelacionResp[] }) => (
  <Stack spacing={1.5}>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
        gap: 1,
      }}
    >
      {[
        ["Nombre", `${persona.nombre} ${persona.apellido}`],
        ["DNI", persona.dni],
        ["Sexo", persona.sexo],
        ["Fecha de nacimiento", formatFecha(persona.fecha_nacimiento)],
      ].map(([etiqueta, valor]) => (
        <Box key={etiqueta} sx={{ p: 1.25, borderRadius: 2, bgcolor: "action.hover" }}>
          <Typography variant="caption" color="text.secondary">
            {etiqueta}
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{valor}</Typography>
        </Box>
      ))}
    </Box>

    {relaciones.length > 0 && (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 700 }}>
          Relaciones registradas
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          {relaciones.map((relacion, index) => (
            <Chip
              key={`${relacion.persona.dni}-${index}`}
              label={`${relacion.vinculo}: ${relacion.persona.nombre} ${relacion.persona.apellido}`}
              variant="outlined"
              size="small"
            />
          ))}
        </Stack>
      </Box>
    )}
  </Stack>
)

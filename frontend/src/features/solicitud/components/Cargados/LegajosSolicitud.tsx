import { Stack, Typography } from "@mui/material"
import { LegajoCarpetaVista } from "@/features/persona/componets/LegajoCarpetaVista"
import type { LegajoSolicitud } from "../../types"

export function LegajosSolicitud({ legajos = [] }: { legajos?: LegajoSolicitud[] }) {
  if (!legajos.length) return null
  return <Stack spacing={1.5}>
    {legajos.map((registro) => <Stack key={registro.id_adolescente} spacing={0.5}>
      <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{registro.nombre}</Typography>
      <LegajoCarpetaVista legajo={registro.legajo} carpeta={registro.carpeta} />
    </Stack>)}
  </Stack>
}

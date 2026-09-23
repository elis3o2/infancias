import { Chip, Stack, Typography } from "@mui/material"
import { TitledCard } from "@/common/components/TitleCard"
import type { SolicitudDetalle } from "../../types"

type Props = Pick<SolicitudDetalle, "adolescentes" | "relaciones_adolescentes">

export const RelacionesAdolescentesCard = ({ adolescentes, relaciones_adolescentes }: Props) => {
  if (!relaciones_adolescentes?.length) return null

  const nombre = (id: number) => {
    const adolescente = (adolescentes ?? []).find((item) => item.id === id)
    return adolescente ? `${adolescente.nombre} ${adolescente.apellido}` : `Adolescente #${id}`
  }

  return (
    <TitledCard
      titulo="Vínculos entre adolescentes"
      componente={
        <Stack spacing={1.5}>
          {relaciones_adolescentes.map((relacion) => (
            <Stack
              key={relacion.id}
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ alignItems: { xs: "flex-start", sm: "center" }, overflowWrap: "anywhere" }}
            >
              <Typography variant="body2">{nombre(relacion.adolescente1)}</Typography>
              <Chip label={relacion.vinculo?.nombre ?? "Vínculo sin especificar"} size="small" color="primary" variant="outlined" />
              <Typography variant="body2">{nombre(relacion.adolescente2)}</Typography>
            </Stack>
          ))}
        </Stack>
      }
    />
  )
}

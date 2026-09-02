import { Card, CardContent, Stack, Typography, Chip } from "@mui/material"
import type { Setter } from "@/common/types"
import type { PrioridadSolicitud } from "../types"

type Props = {
  prioridad: PrioridadSolicitud
  setPrioridad: Setter<PrioridadSolicitud>
}

const OPCIONES: { id: number; nombre: string; color: "success" | "warning" | "error" }[] = [
  { id: 3, nombre: "Preventiva", color: "success" },
  { id: 2, nombre: "Prioritaria", color: "warning" },
  { id: 1, nombre: "Urgente", color: "error" },
]

export const PrioridadSelector = ({ prioridad, setPrioridad }: Props) => {
  return (
    <Card sx={{ borderRadius: 3, minWidth: 1028 }}>
      <CardContent>
        <Typography variant="h6" sx={{ lineHeight: 1.2, mb: 2 }}>
          Prioridad
        </Typography>
        <Stack direction="row" spacing={1}>
          {OPCIONES.map(({ id, nombre, color }) => {
            const seleccionado = prioridad.id === id
            return (
              <Chip
                key={id}
                label={nombre}
                color={color}
                variant={seleccionado ? "filled" : "outlined"}
                onClick={() => setPrioridad({ id, nombre })}
                sx={{ fontWeight: seleccionado ? 600 : 400, cursor: "pointer" }}
              />
            )
          })}
        </Stack>
      </CardContent>
    </Card>
  )
}
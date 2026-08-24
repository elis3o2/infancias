import { Card, CardContent, Stack, Typography, Divider, Box } from "@mui/material"
import type { InstitucionFormData } from "@/features/domicilio/types"
import { InstitucionCard } from "./InstitucionCard";

type Props = {
  instituciones: InstitucionFormData[]
  onEliminar?: (n: number) => void
}

export const InstitucionesCard = ({instituciones, onEliminar }: Props) => {
  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Instituciones de referencia
        </Typography>

        <Stack spacing={2}>
          {instituciones.map((institucion, index) => (
            <Box key={index}>
              <InstitucionCard
                institucion={institucion}
                {...(onEliminar != null && {onEditar: () => onEliminar(index)})}
              />

              {index < instituciones.length - 1 && (
                <Divider sx={{ mt: 2 }} />
              )}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
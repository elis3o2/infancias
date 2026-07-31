import type { Setter } from "@/common/types"
import type { Institucion, InstitucionCreate } from "../../types"
import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Box,
  Typography,
  Divider,
  Button,
} from "@mui/material"

type Props = {
    institucion: Institucion | InstitucionCreate
    setFinshInstitucion: Setter<boolean>
}

const Campo = ({ label, valor }: { label: string; valor: string }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500}>
      {valor}
    </Typography>
  </Box>
)


export const InstitucionView = ({ institucion, setFinshInstitucion } : Props) => {
    return (
        <Card  sx={{ minWidth: 1028 }}>
        <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="h6">
                {institucion.nombre}
            </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
                <Campo label="Dirección" valor={institucion.domicilio.nombre} />
                <Campo label="Telefono" valor={institucion.telefono}  />
            </Stack>
        </CardContent>
        <CardActions>
            <Button onClick={() => setFinshInstitucion(false)}>
            Editar
            </Button>
        </CardActions>
        </Card>
    )
}

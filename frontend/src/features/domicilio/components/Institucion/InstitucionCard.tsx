import type {  Institucion } from "../../types"
import {
  Box,
  Card,
  CardContent,
  List,
  Stack,
  Typography,
} from "@mui/material"
import BusinessIcon from "@mui/icons-material/Business";
import CategoryIcon from "@mui/icons-material/Category";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import { DatoItem } from "@/common/components/DatoItem"

type Props = {
  institucion: Institucion
}


export const InstitucionCard = ({ institucion }: Props) => {

  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <Typography variant="h6" lineHeight={1.2}>
               Datos de la institucion solicitante
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={3}>
          <Box sx={{ flex: 1 }}>
            <List
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: 3,
                rowGap: 0,
                bgcolor: "action.hover",
                borderRadius: 2,
                px: 2,
                py: 1,
              }}
            >
              <DatoItem icon={<BusinessIcon fontSize="small" />} label="Nombre" valor={institucion.nombre} />
              <DatoItem icon={<CategoryIcon fontSize="small" />} label="Tipo institución" valor={institucion.tipo.nombre} />

              <DatoItem icon={<LocationOnIcon fontSize="small" />} label="Direccion" valor={institucion.domicilio.nombre} />
              <DatoItem icon={<PhoneIcon fontSize="small" />} label="Telefono" valor={institucion.telefono} />

            </List>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
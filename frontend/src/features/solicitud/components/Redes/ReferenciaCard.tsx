import {
  Card,
  CardContent,
  List,
  Stack,
  Typography,
  Divider,
  Box
} from "@mui/material"
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import { DatoItem } from "@/common/components/DatoItem"
import type { Referencia } from "@/features/domicilio/types"

type Props = {
    nombre: string
    referencias: Referencia[]
}

export const ReferenciaCard = ({ nombre, referencias }: Props) => {
  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          { nombre }
        </Typography>
        <Stack spacing={2}>
        {referencias.map((referencia, index) => (
            <Box key={referencia.id ?? index}>
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
                <DatoItem icon={<BusinessIcon fontSize="small" />} label="Nombre" valor={referencia.nombre} />
                <DatoItem icon={<LocationOnIcon fontSize="small" />} label="Direccion" valor={referencia.domicilio.nombre} />
                <DatoItem icon={<PhoneIcon fontSize="small" />} label="Telefono" valor={referencia.telefono} />
            </List>

            {index < referencias.length - 1 && (
                <Divider sx={{ mt: 2 }} />
            )}
            </Box>
        ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
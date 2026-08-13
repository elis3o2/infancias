import {
  Card,
  CardContent,
  List,
  Stack,
  Typography,
  Divider,
  Box, 
  CardActions,
  Button
} from "@mui/material"
import BusinessIcon from "@mui/icons-material/Business";
import CategoryIcon from "@mui/icons-material/Category";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import { DatoItem } from "@/common/components/DatoItem"
import type { Institucion } from "@/features/domicilio/types"

type Props = {
  instituciones: Institucion[]
  onEliminar?: (n: number) => void
}

export const InstitucionesCard = ({ instituciones, onEliminar }: Props) => {
  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Instituciones de referencia
        </Typography>
        <Stack spacing={2}>
        {instituciones.map((institucion, index) => (
            <Box key={institucion.id ?? index}>
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
              <DatoItem icon={<EmailIcon fontSize="small" />} label="Correo" valor={institucion.correo}/>
            </List>
                {onEliminar && 
              <CardActions>
                <Button onClick={() => onEliminar(index)}>Eliminar</Button>
              </CardActions>}
            
            {index < instituciones.length - 1 && (
                <Divider sx={{ mt: 2 }} />
            )}
            </Box>
        ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
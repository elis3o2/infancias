import type {  Solicitante } from "../../types"
import {
  Box,
  Card,
  CardContent,
  List,
  Stack,
  Typography,
} from "@mui/material"
import BadgeIcon from "@mui/icons-material/Badge"
import PersonIcon from "@mui/icons-material/Person"
import PhoneIcon from "@mui/icons-material/Phone"
import EmailIcon from "@mui/icons-material/Email"
import { DatoItem } from "@/common/components/DatoItem"

type Props = {
  solicitante: Solicitante
}


export const SolicitanteCard = ({ solicitante }: Props) => {


  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <Typography variant="h6" lineHeight={1.2}>
               Datos del solicitante
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
              <DatoItem icon={<PersonIcon fontSize="small" />} label="Nombre" valor={solicitante.nombre} />
              <DatoItem icon={<PersonIcon fontSize="small" />} label="Apellido" valor={solicitante.apellido} />
              <DatoItem icon={<BadgeIcon fontSize="small" />} label="DNI" valor={solicitante.dni} />
              <DatoItem icon={<PhoneIcon fontSize="small" />} label="Teléfono" valor={solicitante.telefono} />
              <DatoItem icon={<EmailIcon fontSize="small" />} label="Correo" valor={solicitante.correo}/>
            </List>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
import type { Familiar } from "../../types"
import {
  Card,
  CardContent,
  List,
  Stack,
  Typography,
  Divider,
  Box
} from "@mui/material"
import BadgeIcon from "@mui/icons-material/Badge"
import PhoneIcon from "@mui/icons-material/Phone"
import PersonIcon from "@mui/icons-material/Person"
import { DatoItem } from "@/common/components/DatoItem"

type Props = {
  familiares: Familiar[]
}

export const FamiliaresCard = ({ familiares }: Props) => {
  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Familiares
        </Typography>
        <Stack spacing={2}>
        {familiares.map((familiar, index) => (
            <Box key={familiar.id ?? index}>
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
                <DatoItem
                icon={<PersonIcon fontSize="small" />}
                label="Nombre"
                valor={familiar.nombre}
                />
                <DatoItem
                icon={<PersonIcon fontSize="small" />}
                label="Apellido"
                valor={familiar.apellido}
                />
                <DatoItem
                icon={<BadgeIcon fontSize="small" />}
                label="Vínculo"
                valor={familiar.vinculo.nombre}
                />
                <DatoItem
                icon={<PhoneIcon fontSize="small" />}
                label="Teléfono"
                valor={familiar.telefono}
                />
            </List>

            {index < familiares.length - 1 && (
                <Divider sx={{ mt: 2 }} />
            )}
            </Box>
        ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
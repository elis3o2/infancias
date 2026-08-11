import type { Hermano } from "../../types"
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  List
} from "@mui/material"
import BadgeIcon from "@mui/icons-material/Badge"
import WcIcon from "@mui/icons-material/Wc"
import CakeIcon from "@mui/icons-material/Cake"
import PersonIcon from "@mui/icons-material/Person"
import { DatoItem } from "@/common/components/DatoItem"

type Props = {
  hermanos: Hermano[]
}

function formatFecha(fecha: string | null | undefined) {
  if (!fecha) return "—"
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return fecha
  const dia = String(d.getUTCDate()).padStart(2, "0")
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0")
  const anio = d.getUTCFullYear()
  return `${dia}-${mes}-${anio}`
}

export const HermanoValidadoCard = ({ hermanos }: Props) => {
  

  function sexoLabel(h: Hermano) {
    return h.sexo === "M" ? "Masculino" : "Femenino"
  }


    return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" lineHeight={1.2}>
            Hermanos
          </Typography>
        </Stack>

        <Stack spacing={3}>
          {hermanos.map((hermano, index) => {
            return (
              <Stack direction="row" spacing={2} key={hermano.dni ?? index}>
                <Box sx={{ flex: 1 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      Datos del hermano
                    </Typography>

                  </Stack>
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
                      <DatoItem icon={<PersonIcon fontSize="small" />} label="Nombre" valor={hermano.nombre} />
                      <DatoItem icon={<PersonIcon fontSize="small" />} label="Apellido" valor={hermano.apellido} />
                      <DatoItem icon={<BadgeIcon fontSize="small" />} label="DNI" valor={hermano.dni} />
                      <DatoItem icon={<WcIcon fontSize="small" />} label="Sexo" valor={sexoLabel(hermano)} />
                      <DatoItem icon={<CakeIcon fontSize="small" />} label="Fecha de nacimiento" valor={formatFecha(hermano.fecha_nacimiento)} />
                    </List>
                </Box>
              </Stack>
            )
          })}
        </Stack>
      </CardContent>
    </Card>
  )
}
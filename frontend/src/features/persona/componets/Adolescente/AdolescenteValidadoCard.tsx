import type {  Adolescente, AdolescenteValidado } from "../../types"
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
import CakeIcon from "@mui/icons-material/Cake"
import SchoolIcon from "@mui/icons-material/School";
import WcIcon from "@mui/icons-material/Wc"
import { Mapa } from "@/features/domicilio/components/Mapa"
import { DatoItem } from "@/common/components/DatoItem"

type Props = {
  adolescente: Adolescente
  adolescente_validao: AdolescenteValidado
}


function formatFecha(fecha: string | null | undefined) {
  if (!fecha) return "—";

  const d = new Date(fecha);

  if (isNaN(d.getTime())) return fecha;

  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const anio = d.getUTCFullYear();

  return `${dia}-${mes}-${anio}`;
}

export const AdolescenteValidadoCard = ({ adolescente, adolescente_validao }: Props) => {
  const sexoLabel = adolescente_validao.sexo === "M" ? "Masculino" : "Femenino"


  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <Typography variant="h6" lineHeight={1.2}>
               Datos del niño, niña o Adolescente
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
              <DatoItem icon={<PersonIcon fontSize="small" />} label="Nombre" valor={adolescente_validao.nombre} />
              <DatoItem icon={<PersonIcon fontSize="small" />} label="Apellido" valor={adolescente_validao.apellido} />
              <DatoItem icon={<BadgeIcon fontSize="small" />} label="DNI" valor={adolescente_validao.dni} />
              <DatoItem icon={<WcIcon fontSize="small" />} label="Sexo" valor={sexoLabel} />
              <DatoItem
                icon={<CakeIcon fontSize="small" />}
                label="Fecha de nacimiento"
                valor={formatFecha(adolescente_validao.fecha_nacimiento)}
              />
             <DatoItem
              icon={<SchoolIcon fontSize="small" />}
              label={"Escolarizado"}
              valor={adolescente.escolarizado? "Si" : "No"}
            />
            </List>
          </Box>
        </Stack>
        <Box sx={{ height: 400, width: "100%", mt: 5}}>
            <Mapa
            latitud={adolescente.domicilio.domicilio_validado.coordenada_x}
            longitud={adolescente.domicilio.domicilio_validado.coordenada_y}
            nombre={adolescente.domicilio.nombre}
        />
        </Box>
      </CardContent>
    </Card>
  )
}
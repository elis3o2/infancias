import type {  Adolescente, AdolescenteValidado } from "../../types"
import {
  Card,
  CardContent,
  Box, Stack, Typography
} from "@mui/material"
import { Mapa } from "@/features/domicilio/components/Mapa"
import { AdolescenteSimpleCard } from "./AdolescenteSimpleCard"

type Props = {
  adolescente: Adolescente
  adolescente_validao: AdolescenteValidado
}

export const AdolescenteValidadoCard = ({ adolescente, adolescente_validao }: Props) => {


  return ( <>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" lineHeight={1.2}>
              Datos del niño, niña o Adolescente
            </Typography>
          </Stack>

        <Stack direction="row" spacing={3}>
          <Box sx={{ flex: 1 }}>

            <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
              <CardContent>
                <AdolescenteSimpleCard
                  nombre={adolescente_validao.nombre}
                  apellido={adolescente_validao.apellido}
                  dni={adolescente_validao.dni}
                  sexo={adolescente_validao.sexo}
                  escolarizado={adolescente.escolarizado}
                  fecha_nacimiento={adolescente_validao.fecha_nacimiento}
                />
              </CardContent>
            </Card>
            </Box>
    </Stack>

    <Box sx={{ height: 400, width: "100%", mt: 5}}>
      <Mapa
          latitud={adolescente.domicilio.domicilio_validado.coordenada_x}
          longitud={adolescente.domicilio.domicilio_validado.coordenada_y}
          nombre={adolescente.domicilio.nombre}
      />
      </Box>
    </>
  )
}
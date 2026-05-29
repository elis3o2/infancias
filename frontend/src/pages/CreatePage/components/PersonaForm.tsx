import {
  Box,
  Grid,
  Typography,
  Stack,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CakeIcon from "@mui/icons-material/Cake";
import HomeIcon from "@mui/icons-material/Home";
import type { Ciudadano } from "../../../features/persona/types";

type Props = {
    ciudadano: Ciudadano
}

export const PersonaForm = ({ciudadano}: Props) => {
    
    const formatFecha = (fecha: string) => {
        try {
        const d = new Date(fecha);
        const dia = d.getUTCDate().toString().padStart(2, "0");
        const mes = d.toLocaleString("es-AR", { month: "long", timeZone: "UTC" });
        const anio = d.getUTCFullYear();
        return `${dia} de ${mes} de ${anio}`;
        } catch {
        return fecha;
        }
    };

    return (    
        <Grid container spacing={2.5}>
        {[
            {
            icon: <PersonIcon fontSize="small" />,
            label: "Nombre completo",
            value: `${ciudadano.nombre} ${ciudadano.apellido}`,
            },
            {
            icon: <CakeIcon fontSize="small" />,
            label: "Fecha de nacimiento",
            value: formatFecha(ciudadano.fechaNacimiento),
            },
            {
            icon: <LocationOnIcon fontSize="small" />,
            label: "Departamento",
            value: ciudadano.departamento,
            },
            {
            icon: <HomeIcon fontSize="small" />,
            label: "Domicilio",
            value: ciudadano.domicilio,
            },
        ].map((row) => (
            <Grid item xs={12} key={row.label}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                sx={{
                    color: "primary.main",
                    mt: "2px",
                    flexShrink: 0,
                    opacity: 0.7,
                }}
                >
                {row.icon}
                </Box>
                <Box>
                <Typography
                    variant="caption"
                    color="text.disabled"
                    textTransform="uppercase"
                    letterSpacing={0.8}
                    display="block"
                >
                    {row.label}
                </Typography>
                <Typography color="text.primary" fontWeight={500}>
                    {row.value}
                </Typography>
                </Box>
            </Stack>
            </Grid>
        ))}
        </Grid>
    )
}
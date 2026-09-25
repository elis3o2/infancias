import { AppBar, Toolbar, Box, Typography } from "@mui/material"
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "#005cc6",
      }}
    >
      <Toolbar sx={{ minHeight: 80 }}>
      <Box
        component="img"
        src="/azul.png"
        alt="Municipalidad de Rosario"
        onClick={() => navigate("/solicitud/")}
        sx={{
          height: 55,
          width: "auto",
          mr: 2,
          cursor: "pointer",
        }}
      />
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            Servicio Local de Promoción y Protección de Derechos de Niñas, Niños y Adolescentes
          </Typography>

          <Typography
            variant="body2"
            sx={{
              lineHeight: 1.2,
              opacity: 0.9,
            }}
          >
            Municipalidad de Rosario
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
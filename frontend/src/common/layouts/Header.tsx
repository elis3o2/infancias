import { AppBar, Toolbar, Box, Typography } from "@mui/material"

export const Header = () => {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "#0056A6",
      }}
    >
      <Toolbar sx={{ minHeight: 80 }}>
        <Box
          component="img"
          src="/logo-municipalidad.png"
          alt="Municipalidad de Rosario"
          sx={{
            height: 55,
            width: "auto",
            mr: 2,
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
            Secretaría de Salud Pública
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
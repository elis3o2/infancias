import { Box, Typography } from "@mui/material"

export const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        width: "100%",
        py: 2,
        px: 2,
        textAlign: "center",
        borderTop: "1px solid",
        borderColor: "divider",
        mt: "auto",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Servicio Local de Promoción y Protección de Derechos de Niñas, Niños y Adolescentes
      </Typography>

      <Typography variant="body2" color="text.secondary">
        Municipalidad de Rosario
      </Typography>
    </Box>
  )
}
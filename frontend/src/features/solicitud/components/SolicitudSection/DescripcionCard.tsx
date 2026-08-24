import { Box, Card, CardContent, Stack, Typography } from "@mui/material"

type Props = {
  nombre: string
  texto: string
}

export const DescripcionCard = ({ nombre, texto }: Props) => {
  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="h6">{nombre}</Typography>
          </Stack>

          <Box
            sx={{
              bgcolor: "action.hover",
              borderRadius: 2,
              px: 2,
              py: 2,
            }}
          >
            <Typography
              variant="body1"
              sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {texto || "Sin datos"}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
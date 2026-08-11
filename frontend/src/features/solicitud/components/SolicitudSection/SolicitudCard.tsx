import { Box, Card, CardContent, Stack, Typography } from "@mui/material"

type Props = {
  descripcion: string
}

export const DescripcionCard = ({ descripcion }: Props) => {
  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">
            Descripción
          </Typography>

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
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {descripcion || "Sin descripción"}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
import { TitledCard } from "@/common/components/TitleCard"
import { Box, Typography } from "@mui/material"

type Props = {
  nombre: string
  texto: string
}

export const DescripcionCard = ({ nombre, texto }: Props) => {
  return (
    <TitledCard
      titulo={nombre}
      componente={
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
              sx={{whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {texto || "Sin datos"}
            </Typography>
        </Box>
      }
    />
  )
}
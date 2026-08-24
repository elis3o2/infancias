import { Box, Button, Stack, Typography } from "@mui/material"
import HomeIcon from "@mui/icons-material/Home"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import type { Setter } from "@/common/types"

type Props = {
  domicilio: string
  observaciones: string | null
  setFinishDomicilio: Setter<boolean>
}

export const DomicilioView = ({ domicilio, observaciones, setFinishDomicilio }: Props) => {

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ alignItems: "flex-start" }}
    >
      <Box
        sx={{
          color: "primary.main",
          mt: "2px",
          flexShrink: 0,
          opacity: 0.7,
        }}
      >
        <HomeIcon fontSize="small" />
      </Box>

      <Box sx={{ flex: 1 }}>
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ alignItems: "center" }}
        >
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            Domicilio
          </Typography>

          <CheckCircleIcon
            fontSize="small"
            color="success"
            sx={{ fontSize: 16 }}
          />
        </Stack>

        <Typography
          color="text.primary"
          sx={{ fontWeight: 500 }}
        >
          {domicilio}
        </Typography>

        {observaciones && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: "italic", mt: 0.25 }}
          >
            {observaciones}
          </Typography>
        )}

        <Button
          size="small"
          variant="text"
          sx={{
            mt: 0.5,
            px: 0,
          }}
          onClick={() => setFinishDomicilio(false)}
        >
          Editar domicilio
        </Button>
      </Box>
    </Stack>
  )
}
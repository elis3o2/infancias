// DatoItem.tsx
import { Stack, Box, Typography } from "@mui/material"
import type { ReactNode } from "react"

type Props = {
  icon: ReactNode
  label: string
  value: string
}

export const DatoItem = ({ icon, label, value }: Props) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start">
    <Box sx={{ color: "primary.main", mt: "2px", flexShrink: 0, opacity: 0.7 }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="caption" color="text.disabled" textTransform="uppercase" letterSpacing={0.8} display="block">
        {label}
      </Typography>
      <Typography color="text.primary" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  </Stack>
)
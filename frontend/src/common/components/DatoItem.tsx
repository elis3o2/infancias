// DatoItem.tsx
import { ListItem, ListItemIcon, ListItemText, Typography } from "@mui/material"
import type { ReactNode } from "react"

type Props = {
  icon: ReactNode
  label: string
  valor: string
}

export const DatoItem = ({ icon, label, valor }:Props) => (
  <ListItem disableGutters sx={{ py: 0.75, px: 0 }}>
    <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>{icon}</ListItemIcon>
    <ListItemText
      primary={
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      }
      secondary={
        <Typography variant="body1" fontWeight={600}>
          {String(valor ?? "").trim() || "—"}
        </Typography>
      }
    />
  </ListItem>
)

import type { Familiar } from "../../types"
import type { Setter } from "@/common/types"
import {
  Card,
  CardContent,
  List,
  Stack,
  Typography,
  Divider,
  Box,
  IconButton,
} from "@mui/material"
import BadgeIcon from "@mui/icons-material/Badge"
import PhoneIcon from "@mui/icons-material/Phone"
import PersonIcon from "@mui/icons-material/Person"
import CloseIcon from "@mui/icons-material/Close"
import { DatoItem } from "@/common/components/DatoItem"

type Props = {
  familiares: Familiar[]
  seleccionados: Set<number>
  setSeleccionados: Setter<Set<number>>
}

export const FamiliaresEditarCard = ({ familiares, seleccionados, setSeleccionados }: Props) => {
  const toggleSeleccionado = (id: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" lineHeight={1.2} sx={{ mb: 2 }}>
          Familiares o Referentes
        </Typography>

        <Stack spacing={2}>
          {familiares.map((familiar, index) => {
            const deseleccionado = !seleccionados.has(familiar.id)
            return (
              <Box key={familiar.id ?? index}>
                <Box sx={{ position: "relative" }}>
                  <List
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      columnGap: 3,
                      rowGap: 0,
                      bgcolor: "action.hover",
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      pr: 6,
                      opacity: deseleccionado ? 0.5 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    <DatoItem
                      icon={<PersonIcon fontSize="small" />}
                      label="Nombre"
                      valor={familiar.nombre}
                    />
                    <DatoItem
                      icon={<PersonIcon fontSize="small" />}
                      label="Apellido"
                      valor={familiar.apellido}
                    />
                    <DatoItem
                      icon={<BadgeIcon fontSize="small" />}
                      label="Vínculo"
                      valor={familiar.vinculo.nombre}
                    />
                    <DatoItem
                      icon={<PhoneIcon fontSize="small" />}
                      label="Teléfono"
                      valor={familiar.telefono}
                    />
                  </List>

                  <IconButton
                    size="small"
                    onClick={() => toggleSeleccionado(familiar.id)}
                    title={deseleccionado ? "Recuperar" : "Quitar"}
                    aria-label={deseleccionado ? `Recuperar ${familiar.nombre}` : `Quitar ${familiar.nombre}`}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: deseleccionado ? "action.selected" : "transparent",
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                {index < familiares.length - 1 && (
                  <Divider sx={{ mt: 2 }} />
                )}
              </Box>
            )
          })}
        </Stack>
      </CardContent>
    </Card>
  )
}
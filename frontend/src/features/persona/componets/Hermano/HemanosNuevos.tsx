import { Box, IconButton, Stack, Typography } from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import type { Setter } from "@/common/types"
import type { Hermano } from "../../types"
import { AgregarHermano } from "./AgregarHemano"

type Props = {
  hermanos: Hermano[]
  setHermanos: Setter<Hermano[]>
}

export const HermanosNuevos = ({ hermanos, setHermanos }: Props) => {
  const handleHermanoAgregado = (hermano: Hermano) => {
    if (hermanos.some((h) => h.dni === hermano.dni)) return
    setHermanos([...hermanos, hermano])
  }

  const handleQuitar = (dniAQuitar: string) => {
    setHermanos(hermanos.filter((h) => h.dni !== dniAQuitar))
  }

  return (
    <Stack spacing={2}>
      <AgregarHermano onHermanoAgregado={handleHermanoAgregado} />

      {hermanos.length > 0 && (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Hermanos agregados</Typography>
          {hermanos.map((h) => (
            <Box
              key={h.dni}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                px: 2,
                py: 1,
              }}
            >
              <Box>
                {h.apellido}, {h.nombre} — DNI: {h.dni} ({h.sexo})
              </Box>
              <IconButton size="small" onClick={() => handleQuitar(h.dni)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
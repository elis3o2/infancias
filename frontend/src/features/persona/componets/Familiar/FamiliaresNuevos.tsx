import { useState } from "react"
import { Box, Button, IconButton, Stack, Typography } from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import type { Setter } from "@/common/types"
import type { Familiar } from "../../types"
import { AgregarFamiliar } from "./AgregarFamiliar"

type Props = {
  familiares: Familiar[]
  setFamiliares: Setter<Familiar[]>
}

export const FamiliaresNuevos = ({ familiares, setFamiliares }: Props) => {
  const [mostrarForm, setMostrarForm] = useState(false)

  const handleFamiliarAgregado = (familiar: Familiar) => {
    setFamiliares([...familiares, familiar])
    setMostrarForm(false) // ocultamos el form despues de agregar
  }

  const handleQuitar = (index: number) => {
    setFamiliares(familiares.filter((_, i) => i !== index))
  }

  return (
    <Stack spacing={2}>
      {mostrarForm ? (
        <AgregarFamiliar onFamiliarAgregado={handleFamiliarAgregado} />
      ) : (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setMostrarForm(true)}
        >
          Agregar familiar
        </Button>
      )}

      {familiares.length > 0 && (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Familiares agregados</Typography>
          {familiares.map((f, index) => (
            <Box
              key={index}
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
                {f.apellido}, {f.nombre} — {f.vinculo.nombre} — Tel: {f.telefono}
              </Box>
              <IconButton size="small" onClick={() => handleQuitar(index)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
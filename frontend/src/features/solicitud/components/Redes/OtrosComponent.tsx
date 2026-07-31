import { useState } from "react"
import { Box, Button, Stack, TextField, Typography, IconButton } from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import type { Setter } from "@/common/types"
import type { Domicilio, Institucion } from "@/features/domicilio/types"
import { TelefonoComponent } from "@/features/persona/componets/TelefonoComponent"

type Props = {
  otros: Institucion[]
  setOtros: Setter<Institucion[]>
}

export const OtrosComponent = ({ otros, setOtros }: Props) => {
  const [nombre, setNombre] = useState("")
  const [domicilio, setDomicilio] = useState("")
  const [telefono, setTelefono] = useState("")

  const handleAgregar = () => {
    if (!nombre.trim()) return

    const direccion = {id: 0, nombre: domicilio, domicilio_validado: null } as Domicilio
    const nuevo: Institucion = {
      id: Date.now(),
      nombre,
      direccion,
      telefono,
      tipo: null,
    } as Institucion

    setOtros([...otros, nuevo])
    setNombre("")
    setDomicilio("")
    setTelefono("")
  }

  const handleEliminar = (id: number) => {
    setOtros(otros.filter((o) => o.id !== id))
  }

  return (
    <Box>
      <Typography variant="h6">Otros</Typography>

      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
        <TextField
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <TextField
          label="Domicilio"
          value={domicilio}
          onChange={(e) => setDomicilio(e.target.value)}
        />
        <TelefonoComponent telefono={telefono} setTelefono={setTelefono}/>
        <Button variant="contained" onClick={handleAgregar}>
          Agregar
        </Button>
      </Stack>

      <Stack sx={{ mt: 2 }}>
        {otros.map((o) => (
          <Stack
            key={o.id}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography>
              {o.nombre} — {(o as any).direccion.nombre} — {(o as any).telefono}
            </Typography>
            <IconButton onClick={() => handleEliminar(o.id)}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}
import { useState } from "react"
import { Box, Button, Stack, TextField, Typography, IconButton } from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import type { Setter } from "@/common/types"
import type { Domicilio, Referencia } from "@/features/domicilio/types"
import { TelefonoComponent } from "@/features/persona/componets/TelefonoComponent"

type Props = {
  otros: Referencia[]
  setOtros: Setter<Referencia[]>
  texto: string
}

export const OtrosComponent = ({ otros, setOtros, texto }: Props) => {
  const [nombre, setNombre] = useState("")
  const [direccion, setDireccion] = useState("")
  const [telefono, setTelefono] = useState("")

  const handleAgregar = () => {
    if (!nombre.trim()) return

    const domicilio = {nombre: direccion, domicilio_validado: null } as Domicilio
    const nuevo = {
      nombre,
      domicilio,
      telefono,
    } as Referencia

    setOtros([...otros, nuevo])
    setNombre("")
    setDireccion("")
    setTelefono("")
  }

  const handleEliminar = (id: number) => {
    setOtros(otros.filter((o) => o.id !== id))
  }

  return (
    <Box>
      <Typography variant="h6">{texto}</Typography>

      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
        <TextField
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <TextField
          label="Domicilio"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
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
              {o.nombre} — {(o as any).domicilio.nombre} — {(o as any).telefono}
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
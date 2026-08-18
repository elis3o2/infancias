import { useEffect, useState } from "react"
import {
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material"
import { getVinculos } from "../../api"
import type { Familiar, Vinculo } from "../../types"

interface AgregarFamiliarProps {
  onFamiliarAgregado: (familiar: Familiar) => void
}

export const AgregarFamiliar = ({ onFamiliarAgregado }: AgregarFamiliarProps) => {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [telefono, setTelefono] = useState("")
  const [vinculoId, setVinculoId] = useState<number | "">("")

  const [vinculos, setVinculos] = useState<Vinculo[]>([])
  const [loadingVinculos, setLoadingVinculos] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const cargarVinculos = async () => {
      try {
        const data = await getVinculos()
        setVinculos(data)
      } catch (e) {
        setError("No se pudieron cargar los vínculos.")
      } finally {
        setLoadingVinculos(false)
      }
    }
    cargarVinculos()
  }, [])

  const puedeAgregar =
    nombre.trim() !== "" &&
    apellido.trim() !== "" &&
    telefono.trim() !== "" &&
    vinculoId !== ""

  const handleAgregar = () => {
    if (!puedeAgregar) return

    const vinculo = vinculos.find((v) => v.id === vinculoId)
    if (!vinculo) return

    onFamiliarAgregado({
      nombre,
      apellido,
      telefono,
      vinculo,
    })

    // reset para poder cargar otro familiar
    setNombre("")
    setApellido("")
    setTelefono("")
    setVinculoId("")
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          fullWidth
        />
        <TextField
          label="Apellido"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          fullWidth
        />
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          fullWidth
        />
        <TextField
          select
          label="Vínculo"
          value={vinculoId}
          onChange={(e) => setVinculoId(Number(e.target.value))}
          fullWidth
          disabled={loadingVinculos}
          helperText={loadingVinculos ? "Cargando vínculos..." : undefined}
        >
          {vinculos.map((v) => (
            <MenuItem key={v.id} value={v.id}>
              {v.nombre}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Button
        variant="contained"
        onClick={handleAgregar}
        disabled={!puedeAgregar}
        startIcon={loadingVinculos ? <CircularProgress size={18} /> : undefined}
      >
        Agregar familiar
      </Button>
    </Stack>
  )
}
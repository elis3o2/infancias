import { useState } from "react"
import { Box, Button, CircularProgress, Alert, Stack } from "@mui/material"
import { DniForm } from "../DniForm"
import { SexoForm } from "../SexoForm"
import { getCiudadano } from "../../api"
import type { Setter } from "@/common/types"
import type { Ciudadano, Hermano } from "../../types"
import { AdolescenteSimpleCard } from "../Adolescente/AdolescenteList"


interface AgregarHermanoProps {
  onHermanoAgregado: (hermano: Hermano) => void
}

export const AgregarHermano = ({ onHermanoAgregado }: AgregarHermanoProps) => {
  const [dni, setDni] = useState("")
  const [sexo, setSexo] = useState<"M" | "F" | "">("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [ciudadano, setCiudadano] = useState<Ciudadano | null>(null)

  const dniValido = /^\d{7,8}$/.test(dni)
  const puedeBuscar = dniValido && sexo !== "" && !loading

  const handleBuscar = async () => {
    if (!puedeBuscar) return
    setLoading(true)
    setError("")
    setCiudadano(null)
    try {
      const data = await getCiudadano(dni, sexo)
      if (!data) {
        setError("No se encontró ningún ciudadano con ese DNI y sexo.")
        return
      }
      setCiudadano(data)
    } catch (e) {
      setError("No se encontro a la persona")
    } finally {
      setLoading(false)
    }
  }

  const handleAgregar = () => {
    if (!ciudadano) return
    onHermanoAgregado({nombre: ciudadano.nombre, apellido: ciudadano.apellido, 
            fecha_nacimiento: ciudadano.fechaNacimiento, sexo: ciudadano.sexo, dni : ciudadano.nroDocumento})
    // reset para poder cargar otro hermano
    setDni("")
    setSexo("")
    setCiudadano(null)
    setError("")
  }

  return (
    <Stack spacing={2}>
      <DniForm dni={dni} setDni={setDni as Setter<string>} />
      <SexoForm sexo={sexo} setSexo={setSexo as Setter<"M" | "F" | "">} />

      <Button
        variant="outlined"
        onClick={handleBuscar}
        disabled={!puedeBuscar}
        startIcon={loading ? <CircularProgress size={18} /> : undefined}
      >
        Buscar hermano
      </Button>

      {error && <Alert severity="error">{error}</Alert>}

      {ciudadano && (
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2 }}>
          <Stack spacing={1}>
            
            <AdolescenteSimpleCard
                nombre={ciudadano.nombre}
                apellido={ciudadano.apellido}
                sexo={ciudadano.sexo}
                dni={ciudadano.nroDocumento}
                fecha_nacimiento={ciudadano.fechaNacimiento}
            />
            <Button variant="contained" onClick={handleAgregar}>
              Agregar hermano
            </Button>
          </Stack>
        </Box>
      )}
    </Stack>
  )
}
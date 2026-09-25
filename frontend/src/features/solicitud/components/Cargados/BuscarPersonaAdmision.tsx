import { useState } from "react"
import { Alert, Box, Button, CircularProgress, Stack } from "@mui/material"
import { DniForm } from "@/features/persona/componets/DniForm"
import { SexoForm } from "@/features/persona/componets/SexoForm"
import { consultarPersonaAdmision, type PersonaConsultada, type TipoAltaAdmision } from "../../admision"
import { getSolicitudErrorMessage } from "../../utils"

type Props = { tipo: TipoAltaAdmision; onEncontrada: (persona: PersonaConsultada) => void }

export function BuscarPersonaAdmision({ tipo, onEncontrada }: Props) {
  const [dni, setDni] = useState("")
  const [sexo, setSexo] = useState<"M" | "F" | "">("")
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState("")
  const buscar = async () => {
    if (buscando || !/^\d{7,8}$/.test(dni) || !sexo) return
    setBuscando(true)
    setError("")
    try {
      onEncontrada(await consultarPersonaAdmision(tipo, dni, sexo))
    } catch (error) {
      setError(getSolicitudErrorMessage(error, "No se pudo consultar a la persona."))
    } finally {
      setBuscando(false)
    }
  }
  return (
    <Stack spacing={2}>
      <Box component="fieldset" disabled={buscando} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <DniForm dni={dni} setDni={(dni) => { setDni(dni); setError("") }} />
          <SexoForm sexo={sexo} setSexo={(sexo) => { setSexo(sexo); setError("") }} />
        </Stack>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      <Button variant="outlined" onClick={buscar} disabled={buscando || !/^\d{7,8}$/.test(dni) || !sexo}
        startIcon={buscando ? <CircularProgress size={18} /> : undefined}>
        {buscando ? "Buscando..." : "Buscar persona"}
      </Button>
    </Stack>
  )
}

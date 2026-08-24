import { useState } from "react"
import { Box, Button, CircularProgress, Alert, Stack } from "@mui/material"
import { DniForm } from "../DniForm"
import { SexoForm } from "../SexoForm"
import { getCiudadano } from "../../api"
import type { Setter } from "@/common/types"
import type { Persona } from "../../types"
import { PersonaList } from "./PersonaList"
import { ciudadanoToPersona } from "../../utils"


type Props = {
  onPersonaAgregado: (persona: Persona) => void
}

export const AgregarPersona = ({ onPersonaAgregado }: Props) => {
    const [dni, setDni] = useState("")
    const [sexo, setSexo] = useState<"M" | "F" | "">("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [persona, setPersona] = useState<Persona | null>(null)

    const dniValido = /^\d{7,8}$/.test(dni)
    const puedeBuscar = dniValido && sexo !== "" && !loading

    const handleBuscar = async () => {
        if (!puedeBuscar) return
        setLoading(true)
        setError("")
        setPersona(null)
        try {
            const data = await getCiudadano(dni, sexo)
            if (!data) {
            setError("No se encontró ningún ciudadano con ese DNI y sexo.")
            return
            }
            setPersona(ciudadanoToPersona(data))
        } catch (e) {
            setError("No se encontro a la persona")
        } finally {
            setLoading(false)
        }
    }

    const handleAgregar = () => {
    if (!persona) return
    onPersonaAgregado(persona)
    // reset para poder cargar otro hermano
    setDni("")
    setSexo("")
    setPersona(null)
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
        Buscar
        </Button>

        {error && <Alert severity="error">{error}</Alert>}

        {persona && (
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2 }}>
            <Stack spacing={1}>
            <PersonaList
                persona={persona}
            />
            <Button variant="contained" onClick={handleAgregar}>
                Agregar
            </Button>
            </Stack>
        </Box>
        )}
    </Stack>
    )
}
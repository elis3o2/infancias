import { useState } from "react"
import { Box, Button, CircularProgress, Alert, Stack } from "@mui/material"
import { DniForm } from "../DniForm"
import { SexoForm } from "../SexoForm"
import { getCiudadano } from "../../api"
import type { PersonaCreate, Vinculo } from "../../types"
import { PersonaList } from "./PersonaList"
import { ciudadanoToPersona } from "../../utils"
import { VinculoForm } from "../VinculoForm"
import { TelefonoOpcionalForm } from "../TelefonoOpcionalForm"
import { DomicilioOpcionalForm } from "@/features/domicilio/components/DomicilioOpcionalForm"
import type { Departamento, DomicilioFormData, Provincia } from "@/features/domicilio/types"


type Props = {
  onPersonaAgregado: (persona: PersonaCreate) => void
  datos_extra: boolean
}

export const AgregarPersona = ({ onPersonaAgregado, datos_extra }: Props) => {
    const [dni, setDni] = useState("")
    const [sexo, setSexo] = useState<"M" | "F" | "">("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [persona, setPersona] = useState<PersonaCreate | null>(null)
    const [vinculo, setVinculo] = useState<Vinculo | null> (null)
    
    const dniValido = /^\d{7,8}$/.test(dni)
    const puedeBuscar = dniValido && sexo !== "" && !loading

    const [telefono, setTelefono] = useState("")
    const [provincia, setProvincia] = useState<Provincia | null>(null)
    const [departamento, setDepartamento] = useState<Departamento | null>(null)
    const [domicilio, setDomicilio] = useState<DomicilioFormData | null>(null)

    const [camposVisibles, setCamposVisibles] = useState({
        telefono: false,
        domicilio: false,
    });

    const formCompleto = !datos_extra || (
        vinculo !== null &&
        (!camposVisibles.telefono || telefono.length === 10) &&
        (!camposVisibles.domicilio || (
            domicilio !== null &&
            domicilio.nombre.trim() !== "" &&
            domicilio.id_departamento !== null
        ))
    )

    const cambiarCampo = (campo: keyof typeof camposVisibles, valor: boolean) => {
        setCamposVisibles(prev => ({...prev, [campo]: valor}));
    };

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
        } catch {
            setError("No se encontro a la persona")
        } finally {
            setLoading(false)
        }
    }

    const handleAgregar = () => {
        if (!persona) return

        const personaActualizada: PersonaCreate = {
            ...persona,
            vinculo,
            telefono: camposVisibles.telefono ? telefono : null,
            domicilio: camposVisibles.domicilio ? domicilio : null,
        }

        onPersonaAgregado(personaActualizada)

        // reset
        setDni("")
        setSexo("")
        setPersona(null)
        setVinculo(null)
        setTelefono("")
        setProvincia(null)
        setDepartamento(null)
        setDomicilio(null)
        setCamposVisibles({
            telefono: false,
            domicilio: false,
        })
        setError("")
    }


    return (
    <Stack spacing={2}>
        <DniForm dni={dni} setDni={setDni} />
        <SexoForm sexo={sexo} setSexo={setSexo} />

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
            />{datos_extra && (
                <>
                    <VinculoForm
                        vinculoSeleccionado={vinculo}
                        setVinculoSeleccionado={setVinculo}
                    />
                    <TelefonoOpcionalForm
                        condicion={camposVisibles.telefono}
                        telefono={telefono}
                        setTelefono={setTelefono}
                        mostrar={(v) => cambiarCampo("telefono", v)}
                    />
                    <DomicilioOpcionalForm
                        condicion={camposVisibles.domicilio}
                        domicilio={domicilio}
                        setDomicilio={setDomicilio}
                        provincia={provincia}
                        setProvincia={setProvincia}
                        departamento={departamento}
                        setDepartamento={setDepartamento}
                        mostrar={(v) => cambiarCampo("domicilio", v)}
                    />
                </>
            )}
            <Button variant="contained" onClick={handleAgregar} disabled={!formCompleto}>
                Agregar
            </Button>

            </Stack>
        </Box>
        )}
    </Stack>
    )
}

import { useState } from "react"
import { Alert, Box, Button, Stack, Typography } from "@mui/material"
import { DniForm } from "@/features/persona/componets/DniForm"
import { SexoForm } from "@/features/persona/componets/SexoForm"
import { PersonaList } from "@/features/persona/componets/Persona/PersonaList"
import { ValidarFamiliarDatos } from "@/features/persona/componets/Validar/ValidarFamiliarDatos"
import { VinculoForm } from "@/features/persona/componets/VinculoForm"
import { getCiudadanoData } from "@/features/api_externa/api"
import { getSolicitudErrorMessage } from "../../../utils"
import type { FamiliarResp } from "@/features/api_externa/types"
import { ContactoFamiliar } from "./ContactoFamiliar"
import { DatosSalud } from "@/features/persona/componets/DatosSalud"
import type { FamiliarRevision } from "./types"

type Props = {
  revision: FamiliarRevision
  resultado: FamiliarResp | null
  busquedaRealizada: boolean
  onChange: (cambios: Partial<FamiliarRevision>) => void
  onEliminar: () => void
}

export function FamiliarRevisionCard({ revision, resultado, busquedaRealizada, onChange, onEliminar }: Props) {
  const { original, persona } = revision
  const [dni, setDni] = useState(original?.dni ?? "")
  const [sexo, setSexo] = useState<"M" | "F" | "">(original?.sexo ?? "")
  const [respuesta, setRespuesta] = useState<FamiliarResp | null>(null)
  const [consultado, setConsultado] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState("")
  const identidadIncompleta = original && (!original.dni || !original.sexo)
  const familiar = original ? { ...original, dni: dni || null, sexo: sexo || null } : null
  const consulta = identidadIncompleta ? respuesta : resultado
  const datosSalud = consulta?.persona ?? consulta?.ciudadano ?? persona

  async function buscar() {
    if (!original || !sexo || !/^\d{7,9}$/.test(dni)) return
    try {
      setBuscando(true)
      setError("")
      const datos = await getCiudadanoData([], [{ id: original.id, dni, sexo }])
      setRespuesta(datos.familiares.find((item) => item.id === original.id) ?? null)
      setConsultado(true)
      onChange({ estado: null, persona: null })
    } catch (error) {
      setError(getSolicitudErrorMessage(error, "No se pudo consultar la identidad. Volvé a intentar."))
    } finally {
      setBuscando(false)
    }
  }

  return (
    <Stack spacing={2} sx={{ p: { xs: 1.5, sm: 2 }, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      {identidadIncompleta && (
        <Stack spacing={2}>
          <Alert severity="info">Completá DNI y sexo para verificar a este familiar.</Alert>
          <Box component="fieldset" disabled={buscando} sx={{ p: 0, m: 0, border: 0 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <DniForm dni={dni} setDni={(valor) => { setDni(valor); setConsultado(false); setRespuesta(null); onChange({ estado: null, persona: null }) }} />
              <SexoForm sexo={sexo} setSexo={(valor) => { setSexo(valor); setConsultado(false); setRespuesta(null); onChange({ estado: null, persona: null }) }} />
            </Stack>
          </Box>
          <Button variant="outlined" onClick={buscar} disabled={buscando || !sexo || !/^\d{7,9}$/.test(dni)}>
            {buscando ? "Buscando..." : "Verificar familiar"}
          </Button>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      )}
      {familiar ? (
        <ValidarFamiliarDatos familiar={familiar} estado={revision.estado}
          setEstado={(estado) => onChange({ estado })} setPersona={(nuevaPersona) => onChange({ persona: nuevaPersona })}
          resultado={consulta}
          busquedaRealizada={identidadIncompleta ? consultado : busquedaRealizada} />
      ) : persona && (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Familiar incorporado durante la validación</Typography>
          <PersonaList persona={persona} />
          <Button color="error" onClick={onEliminar} sx={{ alignSelf: "flex-start" }}>Quitar familiar</Button>
        </Stack>
      )}
      {datosSalud && <DatosSalud persona={datosSalud} />}
      {revision.estado === "confirmado" && persona && (
        <Stack spacing={2}>
          <VinculoForm vinculoSeleccionado={persona.vinculo}
            setVinculoSeleccionado={(vinculo) => onChange({ persona: { ...persona, vinculo, id_vinculo: vinculo?.id } })} />
          {!persona.vinculo && <Alert severity="warning">Elegí el vínculo con este adolescente para continuar.</Alert>}
          <ContactoFamiliar persona={persona} familiar={original} onChange={(datos) => onChange({ persona: datos })} />
        </Stack>
      )}
    </Stack>
  )
}

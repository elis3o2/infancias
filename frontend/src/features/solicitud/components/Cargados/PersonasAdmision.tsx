import { useState } from "react"
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material"
import { TitledCard } from "@/common/components/TitleCard"
import { agregarAdolescenteSolicitud, agregarFamiliarSolicitud } from "../../api"
import { adolescenteAdmisionInput, familiarAdmisionInput, type PersonaConsultada, type TipoAltaAdmision } from "../../admision"
import type { Solicitud } from "../../types"
import { getSolicitudErrorMessage } from "../../utils"
import { BuscarPersonaAdmision } from "./BuscarPersonaAdmision"
import { DatosPersonaAdmision } from "./DatosPersonaAdmision"
import { nombreDelAdolescente } from "./solicitudDetalle"

type Props = {
  solicitud: Solicitud
  bloqueado: boolean
  onActualizar: (solicitud: Solicitud) => void
  onGuardando: (guardando: boolean) => void
}

export function PersonasAdmision({ solicitud, bloqueado, onActualizar, onGuardando }: Props) {
  const [tipo, setTipo] = useState<TipoAltaAdmision | null>(null)
  const [mensaje, setMensaje] = useState("")
  if (!solicitud.puede_agregar_personas) return null
  return (
    <TitledCard titulo="Agregar personas en admisión" componente={
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Consultá los datos y elegí con qué adolescente de la solicitud se vincula la persona.
        </Typography>
        {mensaje && <Alert severity="success">{mensaje}</Alert>}
        {tipo ? (
          <AltaPersonaAdmision key={tipo} solicitud={solicitud} tipo={tipo} bloqueado={bloqueado}
            onGuardando={onGuardando} onCancelar={() => setTipo(null)}
            onActualizar={(actualizada) => {
              onActualizar(actualizada)
              setMensaje(tipo === "adolescente" ? "Adolescente agregado correctamente." : "Familiar agregado correctamente.")
              setTipo(null)
            }} />
        ) : (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button variant="outlined" disabled={bloqueado} onClick={() => { setMensaje(""); setTipo("familiar") }}>Agregar familiar</Button>
            <Button variant="outlined" disabled={bloqueado} onClick={() => { setMensaje(""); setTipo("adolescente") }}>Agregar adolescente</Button>
          </Stack>
        )}
      </Stack>
    } />
  )
}

type AltaProps = Props & { tipo: TipoAltaAdmision; onCancelar: () => void }

export function AltaPersonaAdmision({ solicitud, tipo, bloqueado, onActualizar, onGuardando, onCancelar }: AltaProps) {
  const [destino, setDestino] = useState<number | "">("")
  const [consulta, setConsulta] = useState<PersonaConsultada | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const guardar = async () => {
    if (!consulta || destino === "" || guardando || bloqueado) return
    setGuardando(true)
    onGuardando(true)
    setError("")
    try {
      const actualizada = tipo === "adolescente"
        ? await agregarAdolescenteSolicitud(solicitud.id, adolescenteAdmisionInput(destino, consulta.persona, consulta.legajoRegistrado))
        : await agregarFamiliarSolicitud(solicitud.id, familiarAdmisionInput(destino, consulta.persona))
      onActualizar(actualizada)
    } catch (error) {
      setError(getSolicitudErrorMessage(error, "No se pudo agregar la persona. Los datos se conservaron para reintentar."))
    } finally {
      setGuardando(false)
      onGuardando(false)
    }
  }
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Nuevo {tipo}</Typography>
      <Box component="fieldset" disabled={guardando || bloqueado} inert={guardando || bloqueado}
        sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Stack spacing={2}>
          <TextField select required fullWidth label="Adolescente con quien se vincula" value={destino}
            onChange={(event) => { setDestino(Number(event.target.value)); setError("") }}>
            {solicitud.adolescentes.filter((adolescente) => adolescente.persona !== null).map((adolescente) => (
              <MenuItem key={adolescente.id} value={adolescente.id}>{nombreDelAdolescente(adolescente)} · DNI {adolescente.dni}</MenuItem>
            ))}
          </TextField>
          {destino === "" ? <Alert severity="info">Seleccioná primero un adolescente de la solicitud.</Alert>
            : consulta ? (
              <>
                <DatosPersonaAdmision tipo={tipo} persona={consulta.persona} legajoRegistrado={consulta.legajoRegistrado}
                  onChange={(persona) => { setConsulta({ ...consulta, persona }); setError("") }} />
                <Button onClick={() => { setConsulta(null); setError("") }}>Buscar otra persona</Button>
              </>
            ) : <BuscarPersonaAdmision tipo={tipo} onEncontrada={setConsulta} />}
        </Stack>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        {consulta && <Button variant="contained" onClick={guardar}
          disabled={guardando || bloqueado || !consulta.persona.vinculo || destino === ""}>
          {guardando ? "Guardando..." : `Guardar ${tipo}`}
        </Button>}
        <Button disabled={guardando || bloqueado} onClick={onCancelar}>Cancelar</Button>
      </Stack>
    </Stack>
  )
}

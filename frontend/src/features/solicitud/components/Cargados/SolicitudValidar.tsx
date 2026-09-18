import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material"
import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded"
import type { AlertSeverity, Setter } from "@/common/types"
import AlertMessage from "@/common/components/AlertMessage"
import { TitledCard } from "@/common/components/TitleCard"
import { InstitucionCard } from "@/features/domicilio/components/Institucion/InstitucionCard"
import { domicilioFormToDomicilioInput } from "@/features/domicilio/utils"
import { getCiudadanoData } from "@/features/persona/api"
import type { PersonaCreate, RespCiudadano } from "@/features/persona/types"
import { ValidarAdolescente } from "@/features/persona/componets/Validar/ValidarAdolescente"
import { ValidarFamiliares } from "@/features/persona/componets/Validar/ValidarFamiliares"
import { AceptarButtons } from "./AceptarButtons"
import { rechazarSolicitud, validarSolicitud } from "../../api"
import {
  type AdolescenteValidacionInput,
  type FamiliarValidacionInput,
  type PersonaValidacionInput,
  type SolicitudCrud,
  type SolicitudValidacionInput,
} from "../../types"
import { getSolicitudErrorMessage } from "../../utils"
import { ArchivoVistaCard } from "../Archivo/ArchivoVistaCard"
import { ContactoCard } from "../Contacto/ContactoCard"
import { DescripcionCard } from "../SolicitudSection/DescripcionCard"

type Props = {
  solicitud: SolicitudCrud
}

type Estado = null | "confirmado" | "rechazado"

type PersonaHistoriaClinica = {
  nombre?: string
  apellido?: string
  dni?: string
  sexo?: string
}

const MAX_DESCRIPCION = 256

export const SolicitudValidar = ({ solicitud }: Props) => {
  const navigate = useNavigate()

  const [personasAdolescentes, setPersonasAdolescentes] = useState<(PersonaCreate | null)[]>(
    () => solicitud.adolescentes.map(() => null),
  )
  const [estadosAdolescentes, setEstadosAdolescentes] = useState<Estado[]>(
    () => solicitud.adolescentes.map(() => null),
  )
  const [personasFamiliares, setPersonasFamiliares] = useState<(PersonaCreate | null)[]>(
    () => solicitud.familiares.map(() => null),
  )
  const [estadosFamiliares, setEstadosFamiliares] = useState<Estado[]>(
    () => solicitud.familiares.map(() => null),
  )
  const [familiaresNuevos, setFamiliaresNuevos] = useState<PersonaCreate[]>([])

  const [nuevaDescripcion, setNuevaDescripcion] = useState("")
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>("success")
  const [ciudadanoData, setCiudadanoData] = useState<RespCiudadano | null>(null)
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)
  const [buscandoDatos, setBuscandoDatos] = useState(false)

  const hayAdolescentes = solicitud.adolescentes.length > 0
  const todosAdolescentesResueltos =
    hayAdolescentes &&
    estadosAdolescentes.length === solicitud.adolescentes.length &&
    estadosAdolescentes.every((estado) => estado !== null)
  const todosFamiliaresResueltos =
    estadosFamiliares.length === solicitud.familiares.length &&
    estadosFamiliares.every((estado) => estado !== null)

  const adolescentesConfirmados = solicitud.adolescentes.flatMap((adolescente, index) => {
    const persona = personasAdolescentes[index]
    return estadosAdolescentes[index] === "confirmado" && persona
      ? [{ adolescente, persona }]
      : []
  })
  const familiaresConfirmados = personasFamiliares.flatMap((persona, index) =>
    estadosFamiliares[index] === "confirmado" && persona ? [persona] : [],
  )
  const familiaresRechazados = solicitud.familiares.flatMap((familiar, index) =>
    estadosFamiliares[index] === "rechazado" ? [familiar.id] : [],
  )
  const hayConfirmacionInvalida =
    estadosAdolescentes.some(
      (estado, index) => estado === "confirmado" && !personasAdolescentes[index],
    ) ||
    estadosFamiliares.some(
      (estado, index) => estado === "confirmado" && !personasFamiliares[index],
    )
  const todosAdolescentesRechazados =
    todosAdolescentesResueltos &&
    estadosAdolescentes.every((estado) => estado === "rechazado")
  const puedeAceptar =
    todosAdolescentesResueltos &&
    todosFamiliaresResueltos &&
    !todosAdolescentesRechazados &&
    adolescentesConfirmados.length > 0 &&
    !hayConfirmacionInvalida

  const personasHistoriaClinica = useMemo(
    () => (ciudadanoData?.hcf ?? []).flatMap(extraerPersonasHistoriaClinica),
    [ciudadanoData],
  )

  const mostrarAlerta = (message: string, severity: AlertSeverity) => {
    setAlertMessage(message)
    setAlertSeverity(severity)
    setAlertOpen(true)
  }

  const setEstadoAdolescenteAt = (index: number): Setter<Estado> => (value) => {
    setEstadosAdolescentes((prev) => {
      const next = [...prev]
      next[index] =
        typeof value === "function"
          ? (value as (previous: Estado) => Estado)(next[index])
          : value
      return next
    })
  }

  const setPersonaAdolescenteAt = (index: number): Setter<PersonaCreate | null> => (value) => {
    setPersonasAdolescentes((prev) => {
      const next = [...prev]
      next[index] =
        typeof value === "function"
          ? (value as (previous: PersonaCreate | null) => PersonaCreate | null)(next[index])
          : value
      return next
    })
  }

  async function buscarDatosCiudadanos() {
    const adolescentes = solicitud.adolescentes.map(({ id, sexo, dni }) => ({ id, sexo, dni }))
    const familiares = solicitud.familiares
      .filter((familiar): familiar is typeof familiar & { dni: string } => Boolean(familiar.dni))
      .map(({ id, sexo, dni }) => ({ id, sexo, dni }))

    try {
      setBuscandoDatos(true)
      const data = await getCiudadanoData(adolescentes, familiares)
      setCiudadanoData(data)
      setBusquedaRealizada(true)
    } catch (error) {
      mostrarAlerta(
        getSolicitudErrorMessage(error, "No se pudieron obtener los datos de RENAPER."),
        "error",
      )
    } finally {
      setBuscandoDatos(false)
    }
  }

  async function rechazar(motivo: string): Promise<boolean> {
    try {
      await rechazarSolicitud(solicitud.id, motivo)
      navigate("/solicitud/")
      return true
    } catch (error) {
      mostrarAlerta(
        getSolicitudErrorMessage(error, "No se pudo rechazar la solicitud."),
        "error",
      )
      return false
    }
  }

  async function aceptar(): Promise<boolean> {
    if (todosAdolescentesRechazados) {
      mostrarAlerta(
        "Todos los adolescentes fueron rechazados. Completá el motivo para rechazar la solicitud.",
        "warning",
      )
      return false
    }

    if (!puedeAceptar) {
      mostrarAlerta(
        "Confirmá o rechazá explícitamente los datos de cada niño, niña, adolescente y familiar antes de continuar.",
        "warning",
      )
      return false
    }

    try {
      const familiaresValidados = normalizarFamiliares([
        ...familiaresConfirmados,
        // Agregar un familiar nuevo es una confirmación explícita del operador.
        ...familiaresNuevos,
      ])

      let familiaresAdjuntados = false
      const adolescentes: AdolescenteValidacionInput[] = solicitud.adolescentes.map(
        (adolescente, index) => {
          const estado = estadosAdolescentes[index]

          if (estado === "rechazado") {
            return { id: adolescente.id, estado }
          }

          const persona = personasAdolescentes[index]
          if (estado !== "confirmado" || !persona) {
            throw new Error("Faltan decisiones o datos confirmados de un niño, niña o adolescente.")
          }

          const adolescenteValidado: AdolescenteValidacionInput = {
            id: adolescente.id,
            estado,
            adolescente_validado: normalizarPersona(persona),
          }

          // Los familiares pertenecen a la solicitud: sus decisiones se
          // envían una sola vez, junto al primer adolescente confirmado.
          if (!familiaresAdjuntados) {
            familiaresAdjuntados = true
            return {
              ...adolescenteValidado,
              ...(familiaresValidados.length > 0
                ? { familiares_validados: familiaresValidados }
                : {}),
              familiares_rechazados: familiaresRechazados,
            }
          }

          return adolescenteValidado
        },
      )

      const payload: SolicitudValidacionInput = {
        descripcion_extra: nuevaDescripcion.trim(),
        adolescentes,
      }

      await validarSolicitud(solicitud.id, payload)
      navigate("/solicitud/")
      return true
    } catch (error) {
      mostrarAlerta(
        error instanceof Error
          ? error.message
          : getSolicitudErrorMessage(error, "No se pudo validar la solicitud."),
        "error",
      )
      return false
    }
  }

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
          Información recibida
        </Typography>
        <Box
          sx={{
            mt: 0.75,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <ContactoCard telefono={solicitud.telefono} correo={solicitud.correo} />
          <InstitucionCard institucion={solicitud.institucion} />
        </Box>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          borderColor: "primary.light",
          bgcolor: "rgba(0, 92, 198, 0.05)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between" }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 42,
                height: 42,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              <PersonSearchRoundedIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Verificar identidad y antecedentes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Se buscan primero datos internos, relaciones y luego RENAPER si es necesario.
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            onClick={buscarDatosCiudadanos}
            disabled={buscandoDatos}
            startIcon={
              buscandoDatos ? <CircularProgress size={16} color="inherit" /> : <SearchRoundedIcon />
            }
            sx={{ minWidth: { sm: 170 }, py: 1.15, fontWeight: 700 }}
          >
            {buscandoDatos ? "Buscando..." : busquedaRealizada ? "Actualizar datos" : "Buscar datos"}
          </Button>
        </Stack>
      </Paper>

      <Stack spacing={3}>
        {solicitud.adolescentes.map((adolescente, index) => {
          const adolescenteCiudadano =
            ciudadanoData?.adolescentes.find((resultado) => resultado.id === adolescente.id) ?? null

          return (
            <ValidarAdolescente
              key={adolescente.id}
              adolescente={adolescente}
              estado={estadosAdolescentes[index] ?? null}
              setEstado={setEstadoAdolescenteAt(index)}
              persona={personasAdolescentes[index] ?? null}
              setPersona={setPersonaAdolescenteAt(index)}
              personaresp={adolescenteCiudadano?.persona ?? null}
              ciudadano={adolescenteCiudadano?.ciudadano ?? null}
              relaciones={adolescenteCiudadano?.relaciones ?? []}
              solicitudes={adolescenteCiudadano?.solicitudes ?? []}
              sinResultados={
                busquedaRealizada &&
                !adolescenteCiudadano?.persona &&
                !adolescenteCiudadano?.ciudadano
              }
            />
          )
        })}
      </Stack>

      <ValidarFamiliares
        familiares={solicitud.familiares}
        estados={estadosFamiliares}
        setEstados={setEstadosFamiliares}
        personas={personasFamiliares}
        setPersonas={setPersonasFamiliares}
        nuevosFamiliares={familiaresNuevos}
        setNuevosFamiliares={setFamiliaresNuevos}
        resultados={ciudadanoData?.familiares ?? []}
        busquedaRealizada={busquedaRealizada}
      />

      {busquedaRealizada && (
        <TitledCard
          titulo="Personas de la historia clínica familiar"
          componente={
            personasHistoriaClinica.length === 0 ? (
              <Typography color="text.secondary">
                No se encontraron personas asociadas a una historia clínica familiar.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {personasHistoriaClinica.map((persona, index) => (
                  <Typography key={`${persona.dni ?? "sin-dni"}-${index}`}>
                    <strong>{persona.nombre} {persona.apellido}</strong>
                    {persona.dni && ` — DNI ${persona.dni}`}
                    {persona.sexo && ` — Sexo ${persona.sexo}`}
                  </Typography>
                ))}
              </Stack>
            )
          }
        />
      )}

      <DescripcionCard nombre="Descripción" texto={solicitud.descripcion} />

      <TextField
        label="Agregar más información"
        value={nuevaDescripcion}
        onChange={(event) => setNuevaDescripcion(event.target.value.slice(0, MAX_DESCRIPCION))}
        multiline
        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.paper", borderRadius: 2.5 } }}
        minRows={3}
        fullWidth
        helperText={`${nuevaDescripcion.length}/${MAX_DESCRIPCION}`}
      />

      <ArchivoVistaCard archivos={solicitud.archivos} />

      {/*solicitud.referencias_instituciones.length > 0 && (
        <InstitucionesCard instituciones={solicitud.referencias_instituciones} />
      )*/}

      <AceptarButtons
        disabledConfirmar={!puedeAceptar}
        disabledRechazar={!todosAdolescentesResueltos}
        rechazoObligatorio={todosAdolescentesRechazados}
        onConfirmar={aceptar}
        onRechazar={rechazar}
      />

      <AlertMessage
        open={alertOpen}
        handleClose={() => setAlertOpen(false)}
        message={alertMessage}
        severity={alertSeverity}
      />
    </Stack>
  )
}

function normalizarPersona(persona: PersonaCreate): PersonaValidacionInput {
  return {
    nombre: persona.nombre.trim(),
    apellido: persona.apellido.trim(),
    dni: persona.dni.trim(),
    sexo: persona.sexo,
    fecha_nacimiento: normalizarFecha(persona.fecha_nacimiento),
    telefono: persona.telefono?.trim() || null,
    domicilio: persona.domicilio ? domicilioFormToDomicilioInput(persona.domicilio) : null,
    legajo: persona.legajo
      ? {
          id_insert: persona.legajo.id_insert,
          carpeta_id: persona.legajo.carpeta_id,
        }
      : null,
  }
}

function normalizarFamiliares(personas: PersonaCreate[]): FamiliarValidacionInput[] {
  const identidades = new Set<string>()

  return personas.map((persona) => {
    const idVinculo = persona.id_vinculo ?? persona.vinculo?.id

    if (idVinculo == null) {
      throw new Error("Cada familiar o referente validado debe tener un vínculo seleccionado.")
    }

    const claveIdentidad = `${persona.dni.trim()}-${persona.sexo}`
    if (identidades.has(claveIdentidad)) {
      throw new Error("La misma persona no puede agregarse más de una vez como familiar o referente.")
    }
    identidades.add(claveIdentidad)

    return {
      ...normalizarPersona(persona),
      ...(persona.id_familiar != null ? { id_familiar: persona.id_familiar } : {}),
      id_vinculo: idVinculo,
      // Los familiares no reciben legajo ni carpeta durante la validación.
      legajo: null,
    }
  })
}

function normalizarFecha(fecha: string): string {
  const fechaSolo = /^(\d{4}-\d{2}-\d{2})/.exec(fecha)?.[1]
  if (fechaSolo) return fechaSolo

  const fechaParseada = new Date(fecha)
  return Number.isNaN(fechaParseada.getTime())
    ? fecha
    : fechaParseada.toISOString().slice(0, 10)
}

function extraerPersonasHistoriaClinica(respuesta: unknown): PersonaHistoriaClinica[] {
  const personas: PersonaHistoriaClinica[] = []
  const vistos = new Set<string>()

  const recorrer = (valor: unknown) => {
    if (Array.isArray(valor)) {
      valor.forEach(recorrer)
      return
    }

    if (!valor || typeof valor !== "object") return

    const registro = valor as Record<string, unknown>
    const texto = (campo: unknown) =>
      typeof campo === "string" || typeof campo === "number" ? String(campo) : undefined
    const nombre = texto(registro.nombre)
    const apellido = texto(registro.apellido)
    const dni = texto(registro.dni ?? registro.documento ?? registro.nroDocumento)

    if (nombre || apellido) {
      const persona = { nombre, apellido, dni, sexo: texto(registro.sexo) }
      const clave = `${dni ?? ""}-${nombre ?? ""}-${apellido ?? ""}`

      if (!vistos.has(clave)) {
        vistos.add(clave)
        personas.push(persona)
      }
    }

    Object.values(registro).forEach(recorrer)
  }

  recorrer(respuesta)
  return personas
}

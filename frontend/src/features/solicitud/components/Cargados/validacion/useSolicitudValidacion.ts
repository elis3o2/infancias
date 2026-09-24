import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { AlertSeverity } from "@/common/types"
import { getCiudadanoData } from "@/features/api_externa/api"
import type { RespCiudadano } from "@/features/api_externa/types"
import type { PersonaCreate } from "@/features/persona/types"
import { rechazarSolicitud, validarSolicitud } from "../../../api"
import type { SolicitudCrud } from "../../../types"
import { getSolicitudErrorMessage } from "../../../utils"
import { datosSinAdolescente, familiaresDelAdolescente } from "../solicitudDetalle"
import { crearPayloadValidacion } from "./payload"
import type { CambioRevision, Revisiones } from "./types"

export function useSolicitudValidacion(solicitud: SolicitudCrud) {
  const navigate = useNavigate()
  const [revisiones, setRevisiones] = useState<Revisiones>(() => Object.fromEntries(
    solicitud.adolescentes.map((adolescente) => [adolescente.id, {
      estado: null, persona: null, legajoRegistrado: false,
      familiares: familiaresDelAdolescente(adolescente, solicitud.familiares).map((original) => ({ original, estado: null, persona: null })),
    }]),
  ))
  const [descripcion, setDescripcion] = useState("")
  const [ciudadanos, setCiudadanos] = useState<RespCiudadano | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [alerta, setAlerta] = useState<{ mensaje: string; severity: AlertSeverity } | null>(null)

  const actualizar = (id: number, cambios: CambioRevision) => {
    setRevisiones((prev) => ({ ...prev, [id]: { ...prev[id], ...(typeof cambios === "function" ? cambios(prev[id]) : cambios) } }))
  }
  const agregarFamiliar = (id: number, persona: PersonaCreate): boolean => {
    const revision = revisiones[id]
    const repetido = revision.familiares.some((familiar) => {
      const datos = familiar.persona ?? familiar.original
      return datos?.dni === persona.dni && datos?.sexo === persona.sexo
    })
    const adolescente = solicitud.adolescentes.find((item) => item.id === id)
    if (repetido || (adolescente?.dni === persona.dni && adolescente.sexo === persona.sexo)) {
      setAlerta({ mensaje: "Esta persona ya está asociada a ese adolescente o es el mismo adolescente.", severity: "warning" })
      return false
    }
    actualizar(id, { familiares: [...revision.familiares, { original: null, estado: "confirmado", persona }] })
    return true
  }

  const items = Object.values(revisiones)
  const hayRechazados = items.some((item) => item.estado === "rechazado" || item.familiares.some((familiar) => familiar.estado === "rechazado"))
  const todosRechazados = items.length > 0 && items.every((item) => item.estado === "rechazado")
  const familiaresSinAdolescente = datosSinAdolescente(solicitud).familiares
  const puedeAceptar = items.length > 0 && !buscando && familiaresSinAdolescente.length === 0 && items.every((item) =>
    item.estado === "confirmado" && item.persona && item.familiares.every((familiar) =>
      familiar.estado === "confirmado" && familiar.persona && (familiar.persona.id_vinculo ?? familiar.persona.vinculo?.id),
    ),
  )

  async function buscar() {
    try {
      setBuscando(true)
      const familiares = solicitud.adolescentes.flatMap((adolescente) => familiaresDelAdolescente(adolescente, solicitud.familiares))
        .flatMap(({ id, dni, sexo }) => dni && sexo ? [{ id, dni, sexo }] : [])
      const resultado = await getCiudadanoData(
        solicitud.adolescentes.map(({ id, dni, sexo }) => ({ id, dni, sexo })), familiares,
      )
      setCiudadanos(resultado)
      // Una nueva consulta necesita confirmar nuevamente la identidad, conservando el resto del borrador.
      setRevisiones((prev) => Object.fromEntries(Object.entries(prev).map(([id, revision]) => [id, {
        ...revision, estado: null,
        familiares: revision.familiares.map((familiar) => familiar.original ? { ...familiar, estado: null } : familiar),
      }])))
    } catch (error) {
      setAlerta({ mensaje: getSolicitudErrorMessage(error, "No se pudieron consultar las identidades."), severity: "error" })
    } finally {
      setBuscando(false)
    }
  }

  async function aceptar() {
    if (!puedeAceptar) {
      setAlerta({ mensaje: "Confirmá cada adolescente y sus familiares, incluyendo sus vínculos.", severity: "warning" })
      return false
    }
    try {
      await validarSolicitud(solicitud.id, crearPayloadValidacion(solicitud, revisiones, descripcion))
      navigate("/solicitud/")
      return true
    } catch (error) {
      setAlerta({ mensaje: getSolicitudErrorMessage(error, error instanceof Error ? error.message : "No se pudo validar la solicitud."), severity: "error" })
      return false
    }
  }

  async function rechazar(motivo: string) {
    try {
      await rechazarSolicitud(solicitud.id, motivo)
      navigate("/solicitud/")
      return true
    } catch (error) {
      setAlerta({ mensaje: getSolicitudErrorMessage(error, "No se pudo rechazar la solicitud."), severity: "error" })
      return false
    }
  }

  return { revisiones, actualizar, agregarFamiliar, descripcion, setDescripcion, ciudadanos, buscando, buscar,
    alerta, cerrarAlerta: () => setAlerta(null), puedeAceptar, hayRechazados, todosRechazados,
    familiaresSinAdolescente, aceptar, rechazar }
}

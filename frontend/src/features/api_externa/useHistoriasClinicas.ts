import { useEffect, useRef, useState } from "react"
import { consultarHistoriasPorEtapas, historiaResuelta, numeroHC, type HistoriasConsultadas } from "./historiasClinicas"
import type { SaludConsulta } from "../persona/salud"

/** Caché efímera de esta pantalla, cancelable y con reintento solo de HCF fallidas. */
export function useHistoriasClinicas(historias: SaludConsulta["hc"][], habilitada = true) {
  const [consultas, setConsultas] = useState<HistoriasConsultadas>(new Map())
  const cache = useRef(consultas)
  const control = useRef<AbortController | null>(null)
  const [revision, setRevision] = useState(0)
  const clave = [...new Set(historias.map(numeroHC).filter((hc): hc is number => hc !== null))].sort((a, b) => a - b).join(",")

  useEffect(() => {
    if (!habilitada || !clave) return
    const actual = new AbortController()
    control.current = actual
    void consultarHistoriasPorEtapas(clave.split(",").map(Number), cache.current, (datos) => {
      cache.current = datos
      setConsultas(datos)
    }, actual.signal).catch(() => { /* Al salir o cambiar de búsqueda se cancela. */ })
    return () => actual.abort()
  }, [clave, habilitada, revision])

  const hcis = clave ? clave.split(",").map(Number) : []
  const pendientes = hcis.filter((hc) => !historiaResuelta(hc, consultas))
  const cargando = habilitada && pendientes.some((hc) => !consultas.has(hc))
  const error = pendientes.some((hc) => consultas.has(hc))

  function reiniciar(soloErrores = false) {
    control.current?.abort()
    cache.current = soloErrores
      ? new Map([...cache.current].filter(([, item]) => "datos" in item)) : new Map()
    setConsultas(cache.current)
    setRevision((valor) => valor + 1)
  }
  return { consultas, cargando, error, reiniciar, reintentar: () => reiniciar(true) }
}

import { useEffect, useRef, useState } from "react"
import { consultarHistoriasPorEtapas, historiaResuelta, historiasFamiliares, type HistoriasConsultadas } from "./historiasClinicas"
import type { SaludConsulta } from "../persona/salud"

/** Caché efímera de esta pantalla, cancelable y con reintento solo de HCF fallidas. */
export function useHistoriasClinicas(personas: readonly (SaludConsulta | null | undefined)[], habilitada = true) {
  const [consultas, setConsultas] = useState<HistoriasConsultadas>(new Map())
  const cache = useRef(consultas)
  const control = useRef<AbortController | null>(null)
  const [revision, setRevision] = useState(0)
  const clave = historiasFamiliares(personas).sort((a, b) => a - b).join(",")

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

  const hcfs = clave ? clave.split(",").map(Number) : []
  const pendientes = hcfs.filter((hcf) => !historiaResuelta(hcf, consultas))
  const cargando = habilitada && pendientes.some((hcf) => !consultas.has(hcf))
  const error = pendientes.some((hcf) => consultas.has(hcf))

  function reiniciar(soloErrores = false) {
    control.current?.abort()
    cache.current = soloErrores
      ? new Map([...cache.current].filter(([, item]) => "datos" in item)) : new Map()
    setConsultas(cache.current)
    setRevision((valor) => valor + 1)
  }
  return { consultas, cargando, error, reiniciar, reintentar: () => reiniciar(true) }
}

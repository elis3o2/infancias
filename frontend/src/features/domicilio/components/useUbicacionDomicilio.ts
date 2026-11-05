import { useEffect, useState } from 'react'
import { getDepartamento } from '../api'
import type { Departamento, Provincia } from '../types'

type Props = {
  id: number | null
  provincia: Provincia | null
  departamento: Departamento | null
  setProvincia: (provincia: Provincia | null) => void
  setDepartamento: (departamento: Departamento | null) => void
}

/** Recupera los nombres del catálogo sin cambiar el domicilio elegido. */
export function useUbicacionDomicilio({ id, provincia, departamento, setProvincia, setDepartamento }: Props) {
  const [estado, setEstado] = useState<{ id: number; cargando: boolean; error: string } | null>(null)
  const [intento, setIntento] = useState(0)
  const necesita = id !== null && (departamento?.id !== id || departamento?.provincia.id !== provincia?.id)
  useEffect(() => {
    if (!necesita || id === null) return
    let cancelado = false
    async function cargar(id: number) {
      setEstado({ id, cargando: true, error: '' })
      try {
        const datos = await getDepartamento(id)
        if (!cancelado) {
          setProvincia(datos.provincia)
          setDepartamento(datos)
          setEstado({ id, cargando: false, error: '' })
        }
      } catch {
        if (!cancelado) setEstado({ id, cargando: false, error: 'No se pudo cargar la ubicación del domicilio. Podés reintentar o seleccionar otra provincia y departamento.' })
      }
    }
    void cargar(id)
    return () => { cancelado = true }
  }, [id, necesita, intento, setProvincia, setDepartamento])
  return {
    cargando: necesita && (estado?.id !== id || estado.cargando),
    error: necesita && estado?.id === id ? estado.error : '',
    reintentar: () => setIntento((valor) => valor + 1),
  }
}

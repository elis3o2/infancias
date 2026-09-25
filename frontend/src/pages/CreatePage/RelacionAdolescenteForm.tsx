import { useEffect, useState } from "react"
import { Alert, Button, MenuItem, Stack, TextField, Typography } from "@mui/material"
import { getVinculosAdolescentes } from "@/features/persona/api"
import type { Vinculo } from "@/features/persona/types"
import { nombreAdolescente, type AdolescenteFormulario } from "./formTypes"

type Props = {
  adolescentes: AdolescenteFormulario[]
  relacion: AdolescenteFormulario["relacion"]
  onChange: (relacion: AdolescenteFormulario["relacion"]) => void
}

export function RelacionAdolescenteForm({ adolescentes, relacion, onChange }: Props) {
  const [vinculos, setVinculos] = useState<Vinculo[]>([])
  const [seleccionado, setSeleccionado] = useState(relacion?.id_temp ?? "")
  const [vinculo, setVinculo] = useState<Vinculo | null>(relacion?.vinculo ?? null)
  const [error, setError] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    let activo = true
    getVinculosAdolescentes().then((datos) => {
      if (activo) { setVinculos(datos); setError(false) }
    }).catch(() => { if (activo) setError(true) })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [intento])

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Vínculo con otro niña, niño o adolescente</Typography>
      <TextField select required fullWidth label="Niña, niño o adolescente ya agregado" value={seleccionado}
        onChange={(event) => {
          const id_temp = event.target.value
          setSeleccionado(id_temp)
          onChange(vinculo ? { id_temp, vinculo } : null)
        }}>
        {adolescentes.map((item) => <MenuItem key={item.id_temp} value={item.id_temp}>{nombreAdolescente(item)}</MenuItem>)}
      </TextField>
      <TextField select required fullWidth label="Vínculo del nuevo niña, niño o adolescente con el seleccionado"
        value={vinculo?.id ?? ""} disabled={!vinculos.length}
        onChange={(event) => {
          const elegido = vinculos.find((item) => item.id === Number(event.target.value)) ?? null
          setVinculo(elegido)
          onChange(elegido && seleccionado ? { id_temp: seleccionado, vinculo: elegido } : null)
        }}>
        {vinculos.map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}
      </TextField>
      {error && <Alert severity="error" action={<Button onClick={() => { setCargando(true); setIntento((valor) => valor + 1) }}>Reintentar</Button>}>
        No se pudo cargar el catálogo de vínculos entre niñas, niños o adolescentes.
      </Alert>}
      {!cargando && !error && !vinculos.length && <Alert severity="warning">
        No hay vínculos habilitados para adolescentes. Es necesario completar el catálogo antes de agregar otro niña, niño o adolescente.
      </Alert>}
    </Stack>
  )
}

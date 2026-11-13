import { useState } from "react"
import { Alert, Button, MenuItem, Stack, TextField, Typography } from "@mui/material"
import type { PersonaHistoriaFamiliar } from "@/features/api_externa/types"
import type { PersonaCreate, Vinculo } from "@/features/persona/types"
import { VinculoForm } from "@/features/persona/componets/VinculoForm"
import type { Revisiones } from "./types"
import { errorIdentidadHistoria, familiarDesdeHistoria, familiarYaAsociado, nombreDestino, puedeAgregarFamiliar, type AdolescenteDestino } from "./familiaresHistoria"

export type AltaFamiliarHistoria = {
  adolescentes: AdolescenteDestino[]
  revisiones: Revisiones
  onAgregar: (id: number, persona: PersonaCreate) => boolean
}

export function AgregarFamiliarHistoria({ integrante, adolescentes, revisiones, onAgregar }: AltaFamiliarHistoria & { integrante: PersonaHistoriaFamiliar }) {
  const [visible, setVisible] = useState(false)
  const [destino, setDestino] = useState<number | "">("")
  const [vinculo, setVinculo] = useState<Vinculo | null>(null)
  const [error, setError] = useState("")
  const identidad = { dni: integrante.DNI, sexo: integrante.sexo }
  const disponibles = adolescentes.filter((item) => puedeAgregarFamiliar(item, revisiones[item.id], identidad))
  const asociados = adolescentes.filter((item) => familiarYaAsociado(revisiones[item.id], identidad))
  const errorIdentidad = errorIdentidadHistoria(integrante)
  const destinoValido = disponibles.some((item) => item.id === destino)

  const cerrar = () => { setVisible(false); setDestino(""); setVinculo(null); setError("") }
  function agregar() {
    if (!destinoValido || destino === "" || !vinculo) return
    try {
      if (onAgregar(destino, familiarDesdeHistoria(integrante, vinculo))) cerrar()
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo agregar al familiar.")
    }
  }

  return <Stack spacing={1.5} sx={{ pt: 1 }}>
    {asociados.length > 0 && <Alert severity="success">
      Familiar agregado a: {asociados.map((item) => nombreDestino(item, revisiones[item.id])).join(", ")}.
    </Alert>}
    {errorIdentidad ? <Alert severity="warning">{errorIdentidad}</Alert>
      : disponibles.length === 0 ? <Typography variant="body2" color="text.secondary">
        No hay adolescentes disponibles para vincular a esta persona.
      </Typography> : visible ? <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Se usarán los datos que se muestran, sin consultar nuevamente. Después podés completar teléfono y domicilio en el grupo del adolescente.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "flex-start" }}>
          <TextField select fullWidth required label="Adolescente con quien tiene vínculo" value={destinoValido ? destino : ""}
            onChange={(event) => { setDestino(Number(event.target.value)); setVinculo(null); setError("") }}>
            {disponibles.map((item) => <MenuItem key={item.id} value={item.id}>
              {nombreDestino(item, revisiones[item.id])} — DNI {item.dni}
            </MenuItem>)}
          </TextField>
          <VinculoForm vinculoSeleccionado={vinculo} setVinculoSeleccionado={(valor) => { setVinculo(valor); setError("") }} />
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="contained" disabled={!destinoValido || !vinculo} onClick={agregar}>Confirmar y agregar familiar</Button>
          <Button onClick={cerrar}>Cancelar</Button>
        </Stack>
      </Stack> : <Button variant="outlined" onClick={() => setVisible(true)} sx={{ alignSelf: "flex-start" }}>
        Agregar como familiar
      </Button>}
  </Stack>
}

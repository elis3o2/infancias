import { useState } from "react"
import { Alert, Button, MenuItem, Stack, TextField } from "@mui/material"
import { TitledCard } from "@/common/components/TitleCard"
import { AgregarPersona } from "@/features/persona/componets/Persona/AgregarPersona"
import type { PersonaCreate } from "@/features/persona/types"
import type { AdolescenteSolicitud } from "../../../types"

type Props = {
  adolescentes: AdolescenteSolicitud[]
  onAgregar: (id: number, persona: PersonaCreate) => boolean
}

export function AgregarFamiliarValidacion({ adolescentes, onAgregar }: Props) {
  const [destino, setDestino] = useState<number | "">("")
  const [visible, setVisible] = useState(false)
  return (
    <TitledCard titulo="Agregar familiar o referente" componente={
      <Stack spacing={2}>
        <TextField select label="Adolescente con quien tiene vínculo" required fullWidth value={destino}
          onChange={(event) => { setDestino(Number(event.target.value)); setVisible(false) }}>
          {adolescentes.map((adolescente) => (
            <MenuItem key={adolescente.id} value={adolescente.id}>{adolescente.nombre} {adolescente.apellido} — DNI {adolescente.dni}</MenuItem>
          ))}
        </TextField>
        {destino === "" ? <Alert severity="info">Seleccioná primero el adolescente. El familiar quedará asociado a su grupo.</Alert> : (
          visible ? <Stack spacing={2}>
            <AgregarPersona key={destino} datos_extra onPersonaAgregado={(persona) => {
              if (onAgregar(destino, persona)) setVisible(false)
            }} />
            <Button onClick={() => setVisible(false)}>Cancelar</Button>
          </Stack> : <Button variant="outlined" onClick={() => setVisible(true)}>Buscar familiar para agregar</Button>
        )}
      </Stack>
    } />
  )
}

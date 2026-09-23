import { useState } from "react"
import { Alert, Button, Divider, MenuItem, Stack, TextField, Typography } from "@mui/material"
import type { Setter } from "@/common/types"
import { TitledCard } from "@/common/components/TitleCard"
import type { DomicilioFormData } from "@/features/domicilio/types"
import type { FamiliarCreate } from "@/features/persona/types"
import { FamiliarForm } from "@/features/persona/componets/Familiar/FamiliarForm"
import { nombreAdolescente, type AdolescenteFormulario } from "@/pages/CreatePage/formTypes"

type Props = {
  adolescentes: AdolescenteFormulario[]
  setAdolescentes: Setter<AdolescenteFormulario[]>
  editando: boolean
  setEditando: Setter<boolean>
  domicilios: DomicilioFormData[]
}

export function FamiliaresSection({ adolescentes, setAdolescentes, editando, setEditando, domicilios }: Props) {
  const [seleccionado, setSeleccionado] = useState("")
  const [error, setError] = useState("")
  const cerrar = () => { setEditando(false); setSeleccionado(""); setError("") }

  function agregar(familiar: FamiliarCreate | null) {
    const adolescente = adolescentes.find((item) => item.id_temp === seleccionado)
    if (!familiar || !adolescente) return
    if (familiar.dni && familiar.sexo && adolescente.familiares.some((item) =>
      item.dni === familiar.dni && item.sexo === familiar.sexo)) {
      setError("Ese familiar ya está asociado al adolescente seleccionado.")
      return
    }
    if (familiar.dni === adolescente.datos.dni && familiar.sexo === adolescente.datos.sexo) {
      setError("El adolescente no puede ser su propio familiar.")
      return
    }
    setAdolescentes((items) => items.map((item) => item.id_temp === seleccionado
      ? { ...item, familiares: [...item.familiares, familiar] } : item))
    cerrar()
  }

  return (
    <TitledCard titulo="Familiares / referentes"
    componente= { 
      <Stack spacing={2}>
        {adolescentes.map((adolescente) =>
        <Stack key={adolescente.id_temp} spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>{nombreAdolescente(adolescente)}</Typography>
          {adolescente.familiares.length === 0 && <Typography color="text.secondary" variant="body2">Sin familiares agregados.</Typography>}
          {adolescente.familiares.map((familiar, index) => 
          <Stack key={index} direction={{ xs: "column", sm: "row" }}
            sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
            <Typography>{familiar.nombre} {familiar.apellido} — {familiar.vinculo?.nombre}</Typography>
            <Button 
              color="error"
              disabled={editando}
              onClick={() => setAdolescentes((items) => items.map((item) =>
                item.id_temp === adolescente.id_temp
                ? { ...item, familiares: item.familiares.filter((_, i) => i !== index) } : item))}>
              Quitar  
            </Button>
          </Stack>)}
        <Divider />
      </Stack>)}
      {!adolescentes.length && <Alert severity="info">Agregá un adolescente antes de cargar sus familiares.</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
      {editando ? <>
        <TextField select required fullWidth label="Adolescente con quien tiene vínculo" value={seleccionado}
          onChange={(event) => { setSeleccionado(event.target.value); setError("") }}>
        {adolescentes.map((item) => <MenuItem key={item.id_temp} value={item.id_temp}>{nombreAdolescente(item)}</MenuItem>)}
      </TextField>
      {seleccionado && 
      <FamiliarForm 
        setFamiliar={agregar} 
        setFinishFamiliar={() => undefined}
        domicilios={domicilios}
      />}
      <Button 
        onClick={cerrar}>
        Cancelar familiar
      </Button>
      </> : 
      <Button 
        variant="outlined"
        disabled={!adolescentes.length}
        onClick={() => { setSeleccionado(""); setEditando(true) }}>
        Agregar familiar / referente
      </Button>}
    </Stack>} />
  )
}

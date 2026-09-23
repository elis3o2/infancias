import { useState } from "react"
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Typography } from "@mui/material"
import type { Setter } from "@/common/types"
import type { DomicilioFormData } from "@/features/domicilio/types"
import { TitledCard } from "@/common/components/TitleCard"
import { AdolescenteComponent } from "./AdolescenteComponent"
import { nombreAdolescente, type AdolescenteFormulario } from "../../../../pages/CreatePage/formTypes"


type Props = {
  adolescentes: AdolescenteFormulario[]
  setAdolescentes: Setter<AdolescenteFormulario[]>
  editor: string | null
  setEditor: Setter<string | null>
  domicilios: DomicilioFormData[]
  setDomicilios: Setter<DomicilioFormData[]>
}

export function AdolescentesSection({ adolescentes, setAdolescentes, editor, setEditor, domicilios, setDomicilios }: Props) {
  const [error, setError] = useState("")
  const [eliminar, setEliminar] = useState<AdolescenteFormulario | null>(null)
  const actual = adolescentes.find((item) => item.id_temp === editor)
  const anteriores = actual ? adolescentes.slice(0, adolescentes.indexOf(actual)) : adolescentes

  function guardar(adolescente: AdolescenteFormulario) {
    if (adolescente.familiares.some((familiar) => familiar.dni === adolescente.datos.dni &&
        familiar.sexo === adolescente.datos.sexo)) {
      setError("El adolescente no puede tener el mismo DNI y sexo que uno de sus familiares.")
      return
    }
    if (adolescentes.some((item) => item.id_temp !== adolescente.id_temp &&
        item.datos.dni === adolescente.datos.dni && item.datos.sexo === adolescente.datos.sexo)) {
      setError("Ya cargaste un adolescente con ese DNI y sexo.")
      return
    }
    setAdolescentes((items) => actual
      ? items.map((item) => item.id_temp === adolescente.id_temp ? adolescente : item)
      : [...items, adolescente])
    setEditor(null)
    setError("")
  }

  return (
  <TitledCard 
    titulo="Niños, niñas y adolescentes"
    componente={
      <Stack spacing={2}>
        {adolescentes.map((item) => {
          const relacionado = adolescentes.find((otro) => otro.id_temp === item.relacion?.id_temp)
            return (
              <Paper key={item.id_temp} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 700 }}>{nombreAdolescente(item)}</Typography>
                  <Typography variant="body2">
                    DNI {item.datos.dni}
                  </Typography>
                  {relacionado && <Typography variant="body2">
                    {item.relacion?.vinculo.nombre} de {nombreAdolescente(relacionado)}
                  </Typography>}
                  <Typography variant="body2" color="text.secondary">
                    {item.familiares.length} familiares · {item.referencias.length} instituciones de referencia
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button disabled={editor !== null} onClick={() => { setError(""); setEditor(item.id_temp) }}>Editar</Button>
                    <Button color="error" disabled={editor !== null} onClick={() => {
                      if (adolescentes.some((otro) => otro.relacion?.id_temp === item.id_temp)) {
                        setError("Otro adolescente tiene vínculo con este. Cambiá esa relación o eliminá primero al adolescente relacionado.")
                      } else { setError(""); setEliminar(item) }
                      }}>
                      Eliminar
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
        )})}
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {editor !== null ?
          <AdolescenteComponent
            key={editor}
            actual={actual}
            anteriores={anteriores}
            domicilios={domicilios}
            setDomicilios={setDomicilios}
            onGuardar={guardar}
            onCancelar={() => { setEditor(null); setError("") }}
          /> : 
          <Button
            variant="outlined"
            onClick={() => setEditor("nuevo")}>
            Agregar adolescente
          </Button>}
        <Dialog open={eliminar !== null} onClose={() => setEliminar(null)}>
          <DialogTitle>Eliminar adolescente del formulario</DialogTitle>
          <DialogContent>Se quitará {eliminar && nombreAdolescente(eliminar)} junto con sus familiares e instituciones de referencia.</DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setEliminar(null)}>
              Cancelar
            </Button>
            <Button 
              color="error"
              onClick={() => {
                setAdolescentes((items) => items.filter((item) => item.id_temp !== eliminar?.id_temp))
                setEliminar(null)
              }}>
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    }/>
  )
}

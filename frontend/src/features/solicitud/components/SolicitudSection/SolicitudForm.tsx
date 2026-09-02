import type { Setter } from "@/common/types"
import type { MotivoSolicitud } from "../../types"
import { Stack, Button, TextField } from "@mui/material"
import { MotivodForm } from "../MotivoForm"

const MAX_DESCRIPCION = 256


type Props = {
  motivoSeleccionado: MotivoSolicitud | null 
  setMotivoSeleccionado: Setter<MotivoSolicitud | null>
  descripcion: string
  setDescripcion: Setter<string>
  setFinishSolicitudSection: Setter<boolean>
}

export const SolicitudForm = ({ motivoSeleccionado, setMotivoSeleccionado, descripcion, setDescripcion, setFinishSolicitudSection }: Props) => {

  const formCompleto =
    descripcion.trim() !== "" &&
    motivoSeleccionado !== null

  const handleCargar = () => {
    if (!formCompleto) return
    setFinishSolicitudSection(true)
  }

  return (<>
        <Stack spacing={2}>
          <MotivodForm motivoSeleccionado={motivoSeleccionado} setMotivoSeleccionado={setMotivoSeleccionado}/>
          <TextField
            label="Breve descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value.slice(0, MAX_DESCRIPCION))}
            multiline
            minRows={3}
            fullWidth
            helperText={`${descripcion.length}/${MAX_DESCRIPCION}`}
          />
        </Stack>
        <Button
          variant="contained"
          onClick={handleCargar}
          disabled={!formCompleto}
          fullWidth
        >
          Cargar
        </Button>   
    </>
  )
}
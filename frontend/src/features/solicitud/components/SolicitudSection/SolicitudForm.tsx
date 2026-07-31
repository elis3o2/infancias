import type { Setter } from "@/common/types"
import type { PrioridadSolicitud, MotivoSolicitud } from "../../types"
import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Button,
  Typography,
  TextField,
} from "@mui/material"
import { MotivodForm } from "../MotivoForm"
import { PrioridadForm } from "../PrioridadForm"

const MAX_DESCRIPCION = 256


type Props = {
    prioridadSeleccionada: PrioridadSolicitud
    setPrioridadSeleccionada: Setter<PrioridadSolicitud | null>
    motivoSeleccionado: MotivoSolicitud
    setMotivoSeleccionado: Setter<MotivoSolicitud | null>
    descripcion: string
    setDescripcion: Setter<string>
    setFinishSolicitudSection: Setter<boolean>
}

export const SolicitudForm = ({ prioridadSeleccionada, setPrioridadSeleccionada, motivoSeleccionado, setMotivoSeleccionado,
                            descripcion, setDescripcion, setFinishSolicitudSection }: Props) => {

  const formCompleto =
    descripcion.trim() !== "" &&
    prioridadSeleccionada !== null &&
    motivoSeleccionado !== null

  const handleCargar = () => {
    if (!formCompleto) return

    setFinishSolicitudSection(true)
  }


  return (
    <Card sx={{ minWidth: 1028 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Datos de la solicitud
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Breve descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value.slice(0, MAX_DESCRIPCION))}
            multiline
            minRows={3}
            fullWidth
            helperText={`${descripcion.length}/${MAX_DESCRIPCION}`}
          />

            <PrioridadForm prioridadSeleccionada={prioridadSeleccionada} setPrioridadSeleccionada={setPrioridadSeleccionada}/>
            <MotivodForm motivoSeleccionado={motivoSeleccionado} setMotivoSeleccionado={setMotivoSeleccionado}/>
        </Stack>
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          onClick={handleCargar}
          disabled={!formCompleto}
          fullWidth
        >
          Cargar
        </Button>
      </CardActions>
    </Card>
  )
}
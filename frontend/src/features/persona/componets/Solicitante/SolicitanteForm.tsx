import type { Solicitante } from "../../types"
import type { Setter } from "@/common/types"
import { DniForm } from "../DniForm"
import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Button,
} from "@mui/material"
import { NombreForm } from "../NombreForm"

type Props = {
  solicitante: Solicitante
  setSolicitante: Setter<Solicitante | null>
  setFinishSolicitante: Setter<boolean>
}

export const SolicitanteForm = ({ solicitante, setSolicitante, setFinishSolicitante}: Props) => {  
  function setNombre (nombre) { 
    setSolicitante({ ...solicitante, nombre })
  }  
  function setApellido (apellido) {
    setSolicitante({ ...solicitante, apellido })
  } 
  function setDni (dni) {
    setSolicitante({ ...solicitante, dni })
  }

  const formCompleto =
    solicitante.nombre.trim() !== "" &&
    solicitante.apellido.trim() !== "" 

  const handleCargar = () => {
    if (!formCompleto) return
    setFinishSolicitante(true)
  }

  return (
    <Card  sx={{ minWidth: 1028 }}>
        <CardContent>
            <Stack spacing={2}>
                <NombreForm
                    label="Nombre"
                    value={solicitante.nombre}
                    setNombre={setNombre}
                />
                <NombreForm
                    label="Apellido"
                    value={solicitante.apellido}
                    setNombre={setApellido}
                />
                <DniForm dni={solicitante.dni} setDni={setDni} />
            </Stack>
        </CardContent>
        <CardActions>
            <Button
                variant="contained"
                onClick={handleCargar}
                disabled={!formCompleto}
                fullWidth
            >
                Cargar solicitante
            </Button>
        </CardActions>
    </Card>
  )
}
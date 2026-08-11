import type { Solicitante } from "../../types"
import type { Setter } from "@/common/types"
import { DniForm } from "../DniForm"
import { TelefonoComponent } from "../TelefonoComponent"
import { CorreoForm } from "../CorreoForm"
import { useState } from "react"
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
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const [correoValido, setCorreoValido] = useState(EMAIL_REGEX.test(solicitante.correo.trim()))
  
  function setNombre (nombre) { 
    setSolicitante({ ...solicitante, nombre })
  }  
  function setApellido (apellido) {
    setSolicitante({ ...solicitante, apellido })
  } 
  function setDni (dni) {
    setSolicitante({ ...solicitante, dni })
  }
  function setCorreo (correo) {
    setSolicitante({ ...solicitante, correo })
  }
  function setTelefono (telefono) {
    setSolicitante({ ...solicitante, telefono })
  }
  const formCompleto =
    solicitante.nombre.trim() !== "" &&
    solicitante.apellido.trim() !== "" &&
    solicitante.telefono.length == 10 &&
    solicitante.correo.trim() !== "" &&
    correoValido

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
                <TelefonoComponent telefono={solicitante.telefono} setTelefono={setTelefono} />
                <CorreoForm
                    correo={solicitante.correo}
                    setCorreo={setCorreo}
                    onValidChange={setCorreoValido}
                />
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
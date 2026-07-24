import type { Solicitante } from "../../types"
import type { Setter } from "@/common/types"
import { DniForm } from "../DniForm"
import { SexoForm } from "../SexoForm"
import { TelefonoComponent } from "../TelefonoComponent"
import { CorreoForm } from "../CorreoForm"
import { useState } from "react"
import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Button,
  Typography,
} from "@mui/material"
import { NombreForm } from "../NombreForm"

type Props = {
  setSolicitante: Setter<Solicitante | null>
  setFinishSolicitante: Setter<boolean>
}

export const SolicitanteForm = ({setSolicitante, setFinishSolicitante}: Props) => {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [dni, setDni] = useState("")
  const [sexo, setSexo] = useState<"M" | "F" | "">("")
  const [telefono, setTelefono] = useState("")
  const [correo, setCorreo] = useState("")
  const [correoValido, setCorreoValido] = useState(true)

  const formCompleto =
    nombre.trim() !== "" &&
    apellido.trim() !== "" &&
    dni.trim() !== "" &&
    sexo !== "" &&
    telefono.length == 10 &&
    correo.trim() !== "" &&
    correoValido

  const handleCargar = () => {
    if (!formCompleto) return

    setSolicitante({
        id: null,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        sexo,
        telefono: telefono.trim(),
        correo: correo.trim(),
    })
    setFinishSolicitante(true)
  }

  return (
    <Card sx={{ maxWidth: 500 }}>
        <CardContent>
            <Typography variant="h6" gutterBottom>
                Datos del solicitante
            </Typography>
            <Stack spacing={2}>
                <NombreForm
                    label="Nombre"
                    value={nombre}
                    setNombre={setNombre}
                />
                <NombreForm
                    label="Apellido"
                    value={apellido}
                    setNombre={setApellido}
                />
                <DniForm dni={dni} setDni={setDni} />
                <SexoForm sexo={sexo} setSexo={setSexo} />
                <TelefonoComponent telefono={telefono} setTelefono={setTelefono} />
                <CorreoForm
                    correo={correo}
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
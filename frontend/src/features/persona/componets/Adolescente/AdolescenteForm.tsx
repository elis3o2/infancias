import type { Adolescente } from "../../types"
import type { Domicilio } from "@/features/domicilio/types"
import type { Setter } from "@/common/types"
import { DniForm } from "../DniForm"
import { SexoForm } from "../SexoForm"
import { useState } from "react"
import {
  Card,
  CardContent,
  CardActions,
  Stack,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Switch,
} from "@mui/material"
import { DomicilioComponent } from "@/features/domicilio/components/DomicilioComponent"

type Props = {
  setAdolescente: Setter<Adolescente | null>
  setFinishAdolescente: Setter<boolean>
}

export const AdolescenteForm = ({ setAdolescente, setFinishAdolescente }: Props) => {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [dni, setDni] = useState("")
  const [sexo, setSexo] = useState<"M" | "F" | "">("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [escolarizado, setEscolarizado] = useState(false)
  const [domicilio, setDomicilio] = useState<Domicilio | null>(null)

  const formCompleto =
    nombre.trim() !== "" &&
    apellido.trim() !== "" &&
    dni.trim() !== "" &&
    sexo !== "" &&
    fechaNacimiento.trim() !== ""

  const handleCargar = () => {
    if (!formCompleto) return

    setAdolescente({
      id: null,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      dni: dni.trim(),
      sexo,
      fecha_nacimiento: fechaNacimiento.trim(),
      escolarizado,
      domicilio,
      redes: [],
    })
    setFinishAdolescente(true)
  }

  return (
    <Card sx={{ maxWidth: 500 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Datos del adolescente
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            fullWidth
          />
          <TextField
            label="Apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            fullWidth
          />
          <DniForm dni={dni} setDni={setDni} />
          <SexoForm sexo={sexo} setSexo={setSexo} />
          <TextField
            label="Fecha de nacimiento"
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={escolarizado}
                onChange={(e) => setEscolarizado(e.target.checked)}
              />
            }
            label="Actualmente escolarizado"
          />
          <DomicilioComponent domicilio={domicilio} setDomicilio={setDomicilio} />
        </Stack>
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          onClick={handleCargar}
          disabled={!formCompleto}
          fullWidth
        >
          Cargar adolescente
        </Button>
      </CardActions>
    </Card>
  )
}
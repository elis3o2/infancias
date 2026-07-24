import type { Hermano } from "../../types"
import type { Setter } from "@/common/types"
import { DniForm } from "../DniForm"
import { SexoForm } from "../SexoForm"
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
  setHermano: Setter<Hermano | null>
  setFinishHermano: Setter<boolean>
}

export const HermanoForm = ({ setHermano, setFinishHermano }: Props) => {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [dni, setDni] = useState("")
  const [sexo, setSexo] = useState<"M" | "F" | "">("")

  const formCompleto =
    nombre.trim() !== "" &&
    apellido.trim() !== "" &&
    dni.trim() !== "" &&
    sexo !== "" 

  const handleCargar = () => {
    if (!formCompleto) return

    setHermano({
      id: null,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      dni: dni.trim(),
      sexo,
    })
    setFinishHermano(true)
  }

  return (
    <Card sx={{ maxWidth: 500 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Datos del hermano
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
        </Stack>
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          onClick={handleCargar}
          disabled={!formCompleto}
          fullWidth
        >
          Cargar hermano
        </Button>
      </CardActions>
    </Card>
  )
}
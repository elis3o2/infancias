import type { HermanoCreate } from "../../types"
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
  TextField
} from "@mui/material"
import { NombreForm } from "../NombreForm"

type Props = {
  setHermano: Setter<HermanoCreate | null>
  setFinishHermano: Setter<boolean>
}

export const HermanoForm = ({ setHermano, setFinishHermano }: Props) => {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [dni, setDni] = useState("")
  const [sexo, setSexo] = useState<"M" | "F" | "">("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")

  const formCompleto =
    nombre.trim() !== "" &&
    apellido.trim() !== "" &&
    dni.trim() !== "" &&
    sexo !== "" 

  const handleCargar = () => {
    if (!formCompleto) return

    setHermano({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      dni: dni.trim(),
      sexo,
      fecha_nacimiento: fechaNacimiento
    })
    setFinishHermano(true)
  }

  return (
    <Card  sx={{ minWidth: 1028 }}>
      <CardContent>
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
          <TextField
            label="Fecha de nacimiento"
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
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
          Cargar hermano
        </Button>
      </CardActions>
    </Card>
  )
}
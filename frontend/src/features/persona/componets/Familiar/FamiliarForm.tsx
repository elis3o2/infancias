import type { Familiar, Vinculo } from "../../types"
import type { Setter } from "@/common/types"
import { TelefonoComponent } from "../TelefonoComponent"
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
import { VinculoForm } from "../VinculoForm"

type Props = {
  setFamiliar: Setter<Familiar | null>
  setFinishFamiliar: Setter<boolean>
}

export const FamiliarForm = ({ setFamiliar, setFinishFamiliar }: Props) => {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [telefono, setTelefono] = useState("")
  const [vinculoSeleccionado, setVinculoSeleccionado] = useState<Vinculo | null>(null)


  const formCompleto =
    nombre.trim() !== "" &&
    apellido.trim() !== "" &&
    vinculoSeleccionado !== null &&
    telefono.length == 10

  const handleCargar = () => {
    if (!formCompleto) return

    setFamiliar({
      id: null,
      nombre,
      apellido,
      telefono,
      vinculo: vinculoSeleccionado,
    })

    setFinishFamiliar(true)
  }

  return (
    <Card sx={{ maxWidth: 500 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Datos del familiar / referente
        </Typography>
        <Stack spacing={2}>
          <NombreForm label="Nombre" value={nombre} setNombre={setNombre} />
          <NombreForm label="Apellido" value={apellido} setNombre={setApellido} />
          <TelefonoComponent telefono={telefono} setTelefono={setTelefono} />   
          <VinculoForm vinculoSeleccionado={vinculoSeleccionado} setVinculoSeleccionado={setVinculoSeleccionado} />
        </Stack>
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          onClick={handleCargar}
          disabled={!formCompleto}
          fullWidth
        >
          Cargar familiar / referente
        </Button>
      </CardActions>
    </Card>
  )
}
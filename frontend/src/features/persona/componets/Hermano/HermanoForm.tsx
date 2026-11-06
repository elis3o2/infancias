import type { HermanoCreate } from "./types"
import { DniForm } from "../DniForm"
import { SexoForm } from "../SexoForm"
import { useState } from "react"
import { Stack, Button } from "@mui/material"
import { FechaInput } from "@/common/components/FechaInput"
import { NombreForm } from "../NombreForm"

type Props = {
  setHermano: (hermano: HermanoCreate | null) => void
  setFinishHermano: (finalizado: boolean) => void
}

export const HermanoForm = ({ setHermano, setFinishHermano }: Props) => {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [dni, setDni] = useState("")
  const [sexo, setSexo] = useState<"M" | "F" | "">("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [fechaValida, setFechaValida] = useState(true)

  const formCompleto =
    nombre.trim() !== "" &&
    apellido.trim() !== "" &&
    dni.trim() !== "" &&
    sexo !== "" && fechaValida

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
        <>
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
          <FechaInput
            label="Fecha de nacimiento"
            value={fechaNacimiento}
            onChange={setFechaNacimiento}
            onValidityChange={setFechaValida}
            fullWidth
          />
        </Stack>
      <Button
          variant="contained"
          onClick={handleCargar}
          disabled={!formCompleto}
          fullWidth
        >
          Cargar hermano
        </Button>
    </>
  )
}

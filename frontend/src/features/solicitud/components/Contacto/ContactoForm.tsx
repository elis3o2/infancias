import { useState } from "react"
import type { Setter } from "@/common/types"
import { TelefonoComponent } from "@/features/persona/componets/TelefonoComponent"
import { CorreoForm } from "@/features/persona/componets/CorreoForm"
import { Box, Button } from "@mui/material"
import { correoEsValido } from "@/features/persona/utils"

type Props = {
  telefono: string
  setTelefono: Setter<string>
  correo: string
  setCorreo: Setter<string>
  setFinishContacto: Setter<boolean>
}

export const ContactoForm = ({telefono, setTelefono, correo, setCorreo, setFinishContacto}: Props) => {
  const [correoValido, setCorreoValido] = useState(correoEsValido(correo))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2}}>
      <TelefonoComponent telefono={telefono} setTelefono={setTelefono} />
      <CorreoForm correo={correo} setCorreo={setCorreo} onValidChange={setCorreoValido} />
      <Button
        variant="contained"
        onClick={() => setFinishContacto(true)}
        disabled={!correoValido || telefono.length !== 10}
        fullWidth
      >
        Guardar
      </Button>
    </Box>
  )
}
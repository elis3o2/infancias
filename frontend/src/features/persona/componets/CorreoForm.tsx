import { useState } from "react"
import { TextField } from "@mui/material"
import { correoEsValido } from "../utils"

type Props = {
  correo: string
  setCorreo: (correo: string) => void
  onValidChange?: (esValido: boolean) => void
}
export const CorreoForm = ({ correo, setCorreo, onValidChange }: Props) => {
  const [tocado, setTocado] = useState(false)

  const esValido = correoEsValido(correo)
  const mostrarError = tocado && correo.trim() !== "" && !esValido

  const handleChange = (value: string) => {
    setCorreo(value)
    onValidChange?.(value.trim() !== "" && correoEsValido(value))
  }

  return (
    <TextField
      label="Correo electrónico"
      type="email"
      value={correo}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={() => setTocado(true)}
      error={mostrarError}
      helperText={mostrarError ? "Ingrese un correo válido" : " "}
      fullWidth
    />
  )
}

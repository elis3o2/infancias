import type { Setter } from "@/common/types"
import { useState } from "react"
import { TextField } from "@mui/material"

type Props = {
  correo: string
  setCorreo: Setter<string>
  onValidChange?: (esValido: boolean) => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const CorreoForm = ({ correo, setCorreo, onValidChange }: Props) => {
  const [tocado, setTocado] = useState(false)

  const esValido = correo.trim() === "" || EMAIL_REGEX.test(correo.trim())
  const mostrarError = tocado && correo.trim() !== "" && !esValido

  const handleChange = (value: string) => {
    setCorreo(value)
    onValidChange?.(value.trim() !== "" && EMAIL_REGEX.test(value.trim()))
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
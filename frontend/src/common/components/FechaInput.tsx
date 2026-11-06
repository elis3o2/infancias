import { useState } from "react"
import { TextField } from "@mui/material"
import { fechaAISO, formatFecha, validarFechaIngresada } from "../fechas"

type Props = {
  label: string
  value: string
  onChange: (valorISO: string) => void
  onValidityChange?: (valida: boolean) => void
  max?: string
  required?: boolean
  fullWidth?: boolean
}

// Un input nativo de tipo date cambia de formato según el navegador.
export function FechaInput({ label, value, onChange, onValidityChange, max, required, fullWidth }: Props) {
  const [edicion, setEdicion] = useState({ valor: value, texto: value ? formatFecha(value) : "" })
  const texto = edicion.valor === value ? edicion.texto : value ? formatFecha(value) : ""
  const error = validarFechaIngresada(texto, max)
  return <TextField label={label} type="text" value={texto} required={required} fullWidth={fullWidth}
    placeholder="DD-MM-AAAA" error={Boolean(error)} helperText={error || "DD-MM-AAAA"}
    slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 10, pattern: "[0-9]{2}-[0-9]{2}-[0-9]{4}" } }}
    inputRef={(input: HTMLInputElement | null) => input?.setCustomValidity(error)}
    onChange={(event) => {
      const nuevoTexto = event.target.value
      const nuevoError = validarFechaIngresada(nuevoTexto, max)
      const iso = nuevoError ? "" : fechaAISO(nuevoTexto)
      setEdicion({ valor: iso, texto: nuevoTexto })
      onChange(iso)
      onValidityChange?.(!nuevoError)
    }} />
}

import { useState } from "react"
import type { FormEvent } from "react"
import { Alert, Box, Button, Stack, TextField } from "@mui/material"
import { getSolicitudErrorMessage } from "../../utils"

type Props = {
  inicial?: string
  onGuardar: (texto: string) => Promise<void>
  onCancelar?: () => void
}

export function ComentarioFormulario({ inicial = "", onGuardar, onCancelar }: Props) {
  const [texto, setTexto] = useState(inicial)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const valido = texto.trim().length > 0 && texto.length <= 256

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!valido || guardando) return
    setGuardando(true)
    setError(null)
    try {
      await onGuardar(texto.trim())
      setTexto("")
    } catch (error) {
      setError(getSolicitudErrorMessage(error, "No se pudo guardar el comentario. Intentá nuevamente."))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Box component="form" onSubmit={guardar}>
      <Stack spacing={1.5}>
        <TextField label={onCancelar ? "Editar comentario" : "Nuevo comentario"}
          value={texto} onChange={(event) => setTexto(event.target.value)} disabled={guardando}
          multiline minRows={3} fullWidth slotProps={{ htmlInput: { maxLength: 256 } }}
          helperText={`${texto.length}/256 caracteres`} />
        {error && <Alert severity="error">{error}</Alert>}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignSelf: { sm: "flex-end" } }}>
          {onCancelar && <Button onClick={onCancelar} disabled={guardando}>Cancelar</Button>}
          <Button type="submit" variant="contained" disabled={!valido || guardando || (!!onCancelar && texto.trim() === inicial)}>
            {guardando ? "Guardando…" : onCancelar ? "Guardar cambios" : "Agregar comentario"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

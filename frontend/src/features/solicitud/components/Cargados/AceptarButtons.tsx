import { useState } from "react"
import {
  Button,
  Card,
  CardContent,
  Collapse,

  Stack,
  TextField,
} from "@mui/material"

type Props = {
  disabledConfirmar: boolean
  disabledRechazar: boolean
  onConfirmar: () => void
  onRechazar: (motivo: string) => void
}

export const AceptarButtons = ({ disabledConfirmar, disabledRechazar, onConfirmar, onRechazar }: Props) => {
  const [mostrarRechazo, setMostrarRechazo] = useState(false)

  const [motivo, setMotivo] = useState("")


  const handleEnviarRechazo = () => {
    onRechazar(motivo)
    setMotivo("")
    setMostrarRechazo(false)
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="success"
              onClick={onConfirmar}
              disabled={disabledConfirmar}
            >
              Confirmar
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={() => {setMostrarRechazo((v) => !v) }}
              disabled={disabledRechazar}
            >
              Rechazar
            </Button>
          </Stack>

          <Collapse in={mostrarRechazo}>
            <Stack spacing={2}>
              <TextField
                label="Motivo del rechazo"
                multiline
                minRows={4}
                fullWidth
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />

              <Button
                variant="contained"
                color="error"
                onClick={handleEnviarRechazo}
                disabled={!motivo.trim()}
              >
                Enviar rechazo
              </Button>
            </Stack>
          </Collapse>
        </Stack>
      </CardContent>
    </Card>
  )
}
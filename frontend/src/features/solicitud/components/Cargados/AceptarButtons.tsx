import { useState } from "react"
import {
  Button,
  Card,
  CardContent,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material"
import { getDerivaciones } from "../../api"
import type { Derivacion } from "../../types"

type Props = {
  disabledConfirmar: boolean
  disabledRechazar: boolean
  onConfirmar: (idDerivacion: number) => void
  onRechazar: (motivo: string) => void
}

export const AceptarButtons = ({ disabledConfirmar, disabledRechazar, onConfirmar, onRechazar }: Props) => {
  const [mostrarRechazo, setMostrarRechazo] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  const [motivo, setMotivo] = useState("")
  const [derivaciones, setDerivaciones] = useState<Derivacion[]>([])
  const [idDerivacion, setIdDerivacion] = useState<number | "">("")

  const handleConfirmar = async () => {
    const data = await getDerivaciones()
    setDerivaciones(data)
    setMostrarConfirmacion(true)
    setMostrarRechazo(false)
  }

  const handleEnviarConfirmacion = () => {
    if (idDerivacion === "") return
    onConfirmar(idDerivacion)
  }

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
              onClick={handleConfirmar}
              disabled={disabledConfirmar}
            >
              Confirmar
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={() => {setMostrarRechazo((v) => !v); setMostrarConfirmacion(false)}}
              disabled={disabledRechazar}
            >
              Rechazar
            </Button>
          </Stack>

          <Collapse in={mostrarConfirmacion}>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Derivación</InputLabel>
                <Select
                  value={idDerivacion}
                  label="Derivación"
                  onChange={(e) => setIdDerivacion(Number(e.target.value))}
                >
                  {derivaciones.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="success"
                disabled={idDerivacion === ""}
                onClick={handleEnviarConfirmacion}
              >
                Confirmar derivación
              </Button>
            </Stack>
          </Collapse>

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
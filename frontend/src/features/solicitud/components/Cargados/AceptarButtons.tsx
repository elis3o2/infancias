import { useState } from "react"
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded"
import SendRoundedIcon from "@mui/icons-material/SendRounded"
import CancelRoundedIcon from "@mui/icons-material/CancelRounded"
import { Alert, Button, Card, CardContent, CardHeader, Collapse, Stack, TextField } from "@mui/material"

type Props = {
  disabledConfirmar: boolean
  disabledRechazar: boolean
  rechazoObligatorio?: boolean
  onConfirmar: () => Promise<boolean>
  onRechazar: (motivo: string) => Promise<boolean>
}

export const AceptarButtons = ({
  disabledConfirmar,
  disabledRechazar,
  rechazoObligatorio = false,
  onConfirmar,
  onRechazar,
}: Props) => {
  const [mostrarRechazo, setMostrarRechazo] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [accionEnCurso, setAccionEnCurso] = useState<"confirmar" | "rechazar" | null>(null)

  const handleConfirmar = async () => {
    setAccionEnCurso("confirmar")
    try {
      await onConfirmar()
    } finally {
      setAccionEnCurso(null)
    }
  }

  const handleEnviarRechazo = async () => {
    setAccionEnCurso("rechazar")
    try {
      const rechazado = await onRechazar(motivo)
      if (rechazado) {
        setMotivo("")
        setMostrarRechazo(false)
      }
    } finally {
      setAccionEnCurso(null)
    }
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "divider", boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)" }}>
      <CardHeader
        title="Decisión sobre la solicitud"
        subheader="Confirmá solo después de revisar la identidad y los antecedentes disponibles."
        titleTypographyProps={{ variant: "h6", fontWeight: 700 }}
        sx={{ px: { xs: 2, sm: 3 }, pb: 0.5 }}
      />
      <CardContent sx={{ px: { xs: 2, sm: 3 }, pt: 1.5 }}>
        <Stack spacing={2}>
          <Alert
            severity={rechazoObligatorio ? "warning" : "info"}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            {rechazoObligatorio
              ? "Todos los adolescentes fueron rechazados. Ingresá el motivo para rechazar la solicitud."
              : "Las acciones quedan disponibles cuando la validación requerida está completa."}
          </Alert>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant="contained"
              color="success"
              onClick={handleConfirmar}
              disabled={disabledConfirmar || accionEnCurso !== null}
              startIcon={<CheckCircleRoundedIcon />}
              sx={{ flex: 1, py: 1.2, fontWeight: 700 }}
            >
              {accionEnCurso === "confirmar" ? "Confirmando..." : "Confirmar solicitud"}
            </Button>

            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                setMostrarRechazo((visible) => (rechazoObligatorio ? true : !visible))
              }}
              disabled={disabledRechazar || accionEnCurso !== null}
              startIcon={<CancelRoundedIcon />}
              sx={{ flex: 1, py: 1.2, fontWeight: 700 }}
            >
              {rechazoObligatorio ? "Ingresar motivo de rechazo" : "Rechazar solicitud"}
            </Button>
          </Stack>

          <Collapse in={mostrarRechazo || rechazoObligatorio}>
            <Stack spacing={2}>
              <TextField
                label="Motivo del rechazo"
                placeholder="Explicá brevemente por qué no se puede validar la solicitud."
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
                disabled={!motivo.trim() || accionEnCurso !== null}
                startIcon={<SendRoundedIcon />}
                sx={{ alignSelf: "flex-end", fontWeight: 700 }}
              >
                {accionEnCurso === "rechazar" ? "Enviando..." : "Enviar rechazo"}
              </Button>
            </Stack>
          </Collapse>
        </Stack>
      </CardContent>
    </Card>
  )
}

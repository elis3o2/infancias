import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button, Stack } from "@mui/material"
import type { AlertSeverity } from "@/common/types"
import AlertMessage from "@/common/components/AlertMessage"
import { derivarSolicitud } from "../../api"
import type { Solicitud } from "../../types"
import { getSolicitudErrorMessage } from "../../utils"
import { ArchivoVistaCard } from "../Archivo/ArchivoVistaCard"
import { ContactoCard } from "../Contacto/ContactoCard"
import EquipoSelect from "../EquipoForm"
import { DescripcionCard } from "../SolicitudSection/DescripcionCard"
import { SolicitudPersonasDetalle } from "./SolicitudPersonasDetalle"
import { ComentariosSolicitud } from "./ComentariosSolicitud"

type Props = {
  solicitud: Solicitud
}

export const SolicitudValidada = ({ solicitud }: Props) => {
  const navigate = useNavigate()
  const [equipoId, setEquipoId] = useState<number | null>(null)
  const [derivando, setDerivando] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>("success")

  const mostrarAlerta = (message: string, severity: AlertSeverity) => {
    setAlertMessage(message)
    setAlertSeverity(severity)
    setAlertOpen(true)
  }

  const handleDerivar = async () => {
    if (equipoId === null || derivando) return

    try {
      setDerivando(true)
      await derivarSolicitud(solicitud.id, equipoId)
      navigate("/solicitud/")
    } catch (error) {
      mostrarAlerta(
        getSolicitudErrorMessage(error, "No se pudo derivar la solicitud."),
        "error",
      )
    } finally {
      setDerivando(false)
    }
  }

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      <ContactoCard telefono={solicitud.telefono} correo={solicitud.correo} />
      <SolicitudPersonasDetalle solicitud={solicitud} />

      <DescripcionCard nombre="Descripción" texto={solicitud.descripcion} />

      {solicitud.descripcion_extra && (
        <DescripcionCard nombre="Información agregada" texto={solicitud.descripcion_extra} />
      )}

      <ArchivoVistaCard archivos={solicitud.archivos ?? []} />

      <ComentariosSolicitud key={solicitud.id} solicitudId={solicitud.id}
        iniciales={solicitud.comentarios ?? []} puedeComentar={solicitud.puede_comentar} />

      {solicitud.equipo?.id === 2 && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <EquipoSelect equipoId={equipoId} onChange={setEquipoId} />
          <Button
            variant="contained"
            onClick={handleDerivar}
            disabled={equipoId === null || derivando}
          >
            {derivando ? "Derivando..." : "Derivar"}
          </Button>
        </Stack>
      )}

      <AlertMessage
        open={alertOpen}
        handleClose={() => setAlertOpen(false)}
        message={alertMessage}
        severity={alertSeverity}
      />
    </Stack>
  )
}

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button, Stack } from "@mui/material"
import type { AlertSeverity } from "@/common/types"
import AlertMessage from "@/common/components/AlertMessage"
import { InstitucionCard } from "@/features/domicilio/components/Institucion/InstitucionCard"
import { InstitucionesCard } from "@/features/domicilio/components/Institucion/InstitucionesCard"
import { AdolescenteCard } from "@/features/persona/componets/Adolescente/AdolescenteCard"
import { FamiliaresCard } from "@/features/persona/componets/Familiar/FamiliaresCard"
import { PersonaCard } from "@/features/persona/componets/Persona/PersonaCard"
import { PersonasCard } from "@/features/persona/componets/Persona/PersonasCard"
import { derivarSolicitud } from "../../api"
import type { Solicitud } from "../../types"
import { getSolicitudErrorMessage } from "../../utils"
import { ArchivoVistaCard } from "../Archivo/ArchivoVistaCard"
import { ContactoCard } from "../Contacto/ContactoCard"
import EquipoSelect from "../EquipoForm"
import { DescripcionCard } from "../SolicitudSection/DescripcionCard"

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
      <InstitucionCard institucion={solicitud.institucion} />

      {solicitud.adolescentes.map((adolescente) => (
        <Stack key={adolescente.id} spacing={2}>
          {adolescente.persona ? (
            <PersonaCard
              persona={adolescente.persona}
              titulo="Datos del niño, niña o adolescente validado"
            />
          ) : (
            <AdolescenteCard adolescente={adolescente} />
          )}

        </Stack>
      ))}

      {solicitud.familiares_validados.length > 0 && (
        <PersonasCard
          personas={solicitud.familiares_validados}
          titulo="Familiares o referentes validados"
        />
      )}

      {solicitud.familiares.length > 0 && <FamiliaresCard familiares={solicitud.familiares} />}

      <DescripcionCard nombre="Descripción" texto={solicitud.descripcion} />

      {solicitud.descripcion_extra && (
        <DescripcionCard nombre="Información agregada" texto={solicitud.descripcion_extra} />
      )}

      <ArchivoVistaCard archivos={solicitud.archivos} />

      {solicitud.referencias_instituciones.length > 0 && (
        <InstitucionesCard instituciones={solicitud.referencias_instituciones} />
      )}

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

import { useEffect, useState } from "react"
import { Box, Button, Typography } from "@mui/material"
import type { AlertSeverity } from "@/common/types"
import AlertMessage from "@/common/components/AlertMessage"
import { Footer } from "@/common/layouts/Footer"
import { Header } from "@/common/layouts/Header"
import type { DomicilioFormData, InstitucionFormData } from "@/features/domicilio/types"
import { InstitucionInicial } from "@/features/domicilio/types"
import { esInstitucionExistente, institucionFormToInstitucionInput } from "@/features/domicilio/utils"
import type { AdolescenteCreate, FamiliarCreate } from "@/features/persona/types"
import {
  adolescenteCreateToAdolescenteInput,
  familiarCreateToFamiliarInput,
} from "@/features/persona/utils"
import { AdolescenteComponent } from "@/features/persona/componets/Adolescente/AdolescenteComponent"
import { FamiliaresComponent } from "@/features/persona/componets/Familiar/FamiliarComponent"
import { InstitucionComponent } from "@/features/domicilio/components/Institucion/InstitucionComponent"
import { ReferenciaInstitucionComponent } from "@/features/domicilio/components/Institucion/ReferenciaInstitucionesComponent"
import { postSolicitud } from "@/features/solicitud/api"
import { ArchivoComponent } from "@/features/solicitud/components/Archivo/ArchivoComponent"
import { ContactoComponent } from "@/features/solicitud/components/Contacto/ContactoComponent"
import { SolicitudComponent } from "@/features/solicitud/components/SolicitudSection/SolicitudComponent"
import type {
  Archivo,
  MotivoSolicitud,
  ReferenciaInstitucionInput,
  SolicitudCreate,
} from "@/features/solicitud/types"
import { getSolicitudErrorMessage } from "@/features/solicitud/utils"

function referenciaFormToInput(
  referencia: InstitucionFormData,
): ReferenciaInstitucionInput {
  const input = institucionFormToInstitucionInput(referencia)

  return esInstitucionExistente(input)
    ? { id: input.id_institucion }
    : input
}

export const CreatePage = () => {
  const [correo, setCorreo] = useState("")
  const [telefono, setTelefono] = useState("")
  const [finishContacto, setFinishContacto] = useState(false)

  const [institucion, setInstitucion] = useState<InstitucionFormData>(InstitucionInicial)
  const [finishInstitucion, setFinishInstitucion] = useState(false)

  const [adolescentes, setAdolescentes] = useState<AdolescenteCreate[]>([])
  const [domicilios, setDomicilios] = useState<DomicilioFormData[]>([])
  const [finishAdolescente, setFinishAdolescente] = useState(false)

  const [familiares, setFamiliares] = useState<FamiliarCreate[]>([])
  const [finishFamiliar, setFinishFamiliar] = useState(false)

  const [motivoSeleccionado, setMotivoSeleccionado] = useState<MotivoSolicitud | null>(null)
  const [descripcion, setDescripcion] = useState("")
  const [finishSolicitudSection, setFinishSolicitudSection] = useState(false)

  const [referencias, setReferencias] = useState<InstitucionFormData[]>([])
  const [finishReferencias, setFinishReferencias] = useState(false)
  const [archivos, setArchivos] = useState<Archivo[]>([])

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>("success")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const mostrarAlerta = (message: string, severity: AlertSeverity) => {
    setAlertMessage(message)
    setAlertSeverity(severity)
    setAlertOpen(true)
  }

  const formularioCompleto =
    finishInstitucion &&
    finishAdolescente &&
    finishContacto &&
    finishSolicitudSection

  async function handleEnviar() {
    if (enviando) return

    if (!motivoSeleccionado) {
      mostrarAlerta("Seleccioná el motivo de la solicitud antes de enviarla.", "error")
      return
    }

    if (adolescentes.length === 0) {
      mostrarAlerta("Agregá al menos un niño, niña o adolescente a la solicitud.", "error")
      return
    }

    try {
      setEnviando(true)

      const institucionInput = institucionFormToInstitucionInput(institucion)
      const base = {
        adolescentes: adolescentes.map(adolescenteCreateToAdolescenteInput),
        familiares: familiares.map(familiarCreateToFamiliarInput),
        referencias_instituciones_data: referencias.map(referenciaFormToInput),
        correo,
        telefono,
        id_motivo: motivoSeleccionado.id,
        descripcion,
        archivos: archivos.map(({ contenido }) => contenido),
      }

      const solicitud: SolicitudCreate = esInstitucionExistente(institucionInput)
        ? { ...base, id_institucion: institucionInput.id_institucion }
        : { ...base, institucion: institucionInput }

      await postSolicitud(solicitud)
      setEnviado(true)
      mostrarAlerta("El formulario fue enviado correctamente.", "success")
    } catch (error) {
      mostrarAlerta(
        getSolicitudErrorMessage(error, "No se pudo enviar el formulario. Revisá los datos e intentá nuevamente."),
        "error",
      )
    } finally {
      setEnviando(false)
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [])

  return (
    <>
      <Header />
      <Box
        sx={{
          background: "linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%)",
          px: 1,
          py: 2.5,
          gap: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {enviado ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6">
              ¡Gracias! Tu solicitud fue enviada correctamente.
            </Typography>
          </Box>
        ) : (
          <>
            <ContactoComponent
              correo={correo}
              setCorreo={setCorreo}
              telefono={telefono}
              setTelefono={setTelefono}
              finishContacto={finishContacto}
              setFinishContacto={setFinishContacto}
            />
            <InstitucionComponent
              institucion={institucion}
              setInstitucion={setInstitucion}
              finishInstitucion={finishInstitucion}
              setFinishInstitucion={setFinishInstitucion}
            />
            <AdolescenteComponent
              adolescentes={adolescentes}
              setAdolescentes={setAdolescentes}
              finishAdolescente={finishAdolescente}
              setFinishAdolescente={setFinishAdolescente}
              domicilios={domicilios}
              setDomicilios={setDomicilios}
            />
            <SolicitudComponent
              motivoSeleccionado={motivoSeleccionado}
              setMotivoSeleccionado={setMotivoSeleccionado}
              descripcion={descripcion}
              setDescripcion={setDescripcion}
              finishSolicitudSection={finishSolicitudSection}
              setFinishSolicitudSection={setFinishSolicitudSection}
            />
            <FamiliaresComponent
              familiares={familiares}
              setFamiliares={setFamiliares}
              finishFamiliar={finishFamiliar}
              setFinishFamiliar={setFinishFamiliar}
              domicilios={domicilios}
            />
            <ReferenciaInstitucionComponent
              instituciones={referencias}
              setInstituciones={setReferencias}
              finishInstitucion={finishReferencias}
              setFinishInstitucion={setFinishReferencias}
            />
            <ArchivoComponent archivos={archivos} setArchivos={setArchivos} />

            <Button
              variant="contained"
              onClick={handleEnviar}
              disabled={!formularioCompleto || enviando}
              sx={{ minWidth: 160 }}
            >
              {enviando ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </>
        )}

        <AlertMessage
          open={alertOpen}
          handleClose={() => setAlertOpen(false)}
          message={alertMessage}
          severity={alertSeverity}
        />
        <Footer />
      </Box>
    </>
  )
}

export default CreatePage

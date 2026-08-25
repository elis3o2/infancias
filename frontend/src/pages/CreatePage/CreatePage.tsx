import { useState } from "react"
import { Box, Button, Typography} from '@mui/material'
import type { AdolescenteCreate, FamiliarCreate, HermanoCreate } from "@/features/persona/types"
import { AdolescenteInicial } from "@/features/persona/types"
import { InstitucionInicial, type InstitucionFormData } from "@/features/domicilio/types"
import type { Archivo, MotivoSolicitud, PrioridadSolicitud, SolicitudCreate } from "@/features/solicitud/types"
import { AdolescenteComponent } from "@/features/persona/componets/Adolescente/AdolescenteComponent"
import { SolicitudComponent } from "@/features/solicitud/components/SolicitudSection/SolicitudComponent"
import { HermanosComponent } from "@/features/persona/componets/Hermano/HermanoComponent"
import { FamiliaresComponent } from "@/features/persona/componets/Familiar/FamiliarComponent"
import { ArchivoComponent } from "@/features/solicitud/components/Archivo/ArchivoComponent"
import { InstitucionComponent } from "@/features/domicilio/components/Institucion/InstitucionComponent"
import { postSolicitud } from "@/features/solicitud/api"
import { AlertMessage } from "@/common/components"
import type { AlertSeverity } from "@/common/types"
import { ReferenciaInstitucionComponent } from "@/features/domicilio/components/Institucion/ReferenciaInstitucionesComponent"
import { Footer } from "@/common/layouts/Footer"
import { Header } from "@/common/layouts/Header"
import { ContactoComponent } from "@/features/solicitud/components/Contacto/ContactoComponent"
import { esInstitucionExistente, institucionFormToInstitucionInput } from "@/features/domicilio/utils"
import { adolescenteCreateToAdolescenteInput } from "@/features/persona/utils"

export const CreatePage = () => {
  const [correo, setCorreo] = useState("")
  const [telefono, setTelefono] = useState("")
  const [finishContacto, setFinishContacto] = useState(false)
  const [institucion, setInstitucion] = useState<InstitucionFormData>(InstitucionInicial)
  const [finishInstitucion, setFinishInstitucion] = useState(false)
  const [adolescente, setAdolescente] = useState<AdolescenteCreate>(AdolescenteInicial)
  const [familiares, setFamiliares] = useState<FamiliarCreate[]>([])
  const [finishFamiliar, setFinishFamiliar] = useState(false)
  const [hermanos, setHermanos] = useState<HermanoCreate[]>([])
  const [finishHermano, setFinishHermano] = useState(true)
  const [finishAdolescente, setFinishAdolescente] = useState(false)
  const [finishSolicitudSection, setFinishSolicitudSection] = useState(false)
  const [prioridadSeleccionada, setPrioridadSeleccionada] = useState<PrioridadSolicitud | null>(null)
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<MotivoSolicitud | null>(null)
  const [descripcion, setDescripcion] = useState("")
  const [referencias, setReferencias] = useState<InstitucionFormData[]>([])
  const [finishReferencias, setFinishReferencias] = useState(false)
  const [archivos, setArchivos] = useState<Archivo[]>([])
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>("success")
  const [enviado, setEnviado] = useState(false)
  
  console.log(familiares)
async function handleEnviar() {

  const adolescenteActualizado = {
      ...adolescente,
      familiares,
      hermanos,
  }

  console.log("ADOLESCENTE", adolescenteActualizado)
  setAdolescente(adolescenteActualizado)
  const institucionInput = institucionFormToInstitucionInput(institucion)
  const adolescenteInput = adolescenteCreateToAdolescenteInput(adolescenteActualizado)

  const base = {
    adolescente: adolescenteInput,
    correo,
    telefono,
    id_motivo: motivoSeleccionado.id,
    id_prioridad: prioridadSeleccionada.id,
    descripcion,
    archivos: archivos.map((archivo) => archivo.contenido),
  };


  const solicitud: SolicitudCreate = esInstitucionExistente(institucionInput)
    ? { ...base, id_institucion: institucionInput.id_institucion }
    : { ...base, institucion: institucionInput };
    console.log(solicitud)

    try {
      console.log("SOLICITUD", solicitud)
      await postSolicitud(solicitud)

      setAlertMessage("El formulario fue enviado correctamente")
      setAlertSeverity("success")
      setAlertOpen(true)

      // Espera un momento para que se vea el alert, y recién ahí oculta el formulario
      setTimeout(() => {
        setEnviado(true)
      }, 2500)

    } catch (error) {
      console.error(error)

      setAlertMessage("Ocurrió un error al enviar el formulario")
      setAlertSeverity("error")
      setAlertOpen(true)
    }
  }

return (
  <>
    <Header/>
    <Box
      sx={{
        background: "linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%)",
        px: 1,
        py: 2.5,
        gap: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
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
            adolescente={adolescente}
            setAdolescente={setAdolescente}
            finishAdolescente={finishAdolescente}
            setFinishAdolescente={setFinishAdolescente}
          />
          <SolicitudComponent
            prioridadSeleccionada={prioridadSeleccionada}
            setPrioridadSeleccionada={setPrioridadSeleccionada}
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
          />
          <HermanosComponent
            hermanos={hermanos}
            setHermanos={setHermanos}
            finishHermano={finishHermano}
            setFinishHermano={setFinishHermano}
          />
          <ReferenciaInstitucionComponent
            instituciones={referencias}
            setInstituciones={setReferencias}
            finishInstitucion={finishReferencias}
            setFinishInstitucion={setFinishReferencias}
          />
          <ArchivoComponent archivos={archivos} setArchivos={setArchivos} />

          <Button
            variant="outlined"
            onClick={() => handleEnviar()}
            disabled={
              !finishInstitucion || !finishAdolescente || !finishContacto || !finishSolicitudSection
            }>
            Enviar
          </Button>
        </>
      )}

      <AlertMessage
        open={alertOpen}
        handleClose={() => setAlertOpen(false)}
        message={alertMessage}
        severity={alertSeverity}
      />
      <Footer/>
    </Box>
  </>
  )
}

export default CreatePage
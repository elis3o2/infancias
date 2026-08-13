import { useState } from "react"
import { Box, Button, Typography} from '@mui/material'
import type { AdolescenteCreate, Familiar, Hermano, Solicitante } from "@/features/persona/types"
import { AdolescenteInicial, SolicitanteInicial } from "@/features/persona/types"
import { InstitucionInicial, type Institucion } from "@/features/domicilio/types"
import type { Archivo, MotivoSolicitud, PrioridadSolicitud } from "@/features/solicitud/types"
import { SolicitanteComponent } from "@/features/persona/componets/Solicitante/SolicitanteComponent"
import { AdolescenteComponent } from "@/features/persona/componets/Adolescente/AdolescenteComponent"
import { SolicitudComponent } from "@/features/solicitud/components/SolicitudSection/SolicitudComponent"
import { HermanosComponent } from "@/features/persona/componets/Hermano/HermanoComponent"
import { FamiliaresComponent } from "@/features/persona/componets/Familiar/FamiliarComponent"
import { ArchivoComponent } from "@/features/solicitud/components/Archivo/ArchivoComponent"
import { InstitucionComponent } from "@/features/domicilio/components/Institucion/InstitucionComponent"
import { postSolicitud } from "@/features/solicitud/api"
import { AlertMessage } from "@/common/components"
import type { AlertSeverity } from "@/common/types"
import { ReferenciaInstitucionComponent } from "@/features/solicitud/components/Redes/ReferenciaInstitucionesComponent"
import { Footer } from "@/common/layouts/Footer"
import { Header } from "@/common/layouts/Header"

export const CreatePage = () => {
  const [solicitante, setSolicitante] = useState<Solicitante>(SolicitanteInicial)
  const [finishSolicitante, setFinishSolicitante] = useState(false)
  const [institucion, setInstitucion] = useState<Institucion>(InstitucionInicial)
  const [finishInstitucion, setFinishInstitucion] = useState(false)
  const [adolescente, setAdolescente] = useState<AdolescenteCreate>(AdolescenteInicial)
  const [familiares, setFamiliares] = useState<Familiar[]>([])
  const [finishFamiliar, setFinishFamiliar] = useState(false)
  const [hermanos, setHermanos] = useState<Hermano[]>([])
  const [finishHermano, setFinishHermano] = useState(true)
  const [finishAdolescente, setFinishAdolescente] = useState(false)
  const [prioridadSeleccionada, setPrioridadSeleccionada] = useState<PrioridadSolicitud | null>(null)
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<MotivoSolicitud | null>(null)
  const [descripcion, setDescripcion] = useState("")
  const [correo, setCorreo] = useState("")
  const [telefono, setTelefono] = useState("")
  const [referencias, setReferencias] = useState<Institucion[]>([])
  const [finishReferencias, setFinishReferencias] = useState(false)
  const [archivos, setArchivos] = useState<Archivo[]>([])
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>("success")
  const [enviado, setEnviado] = useState(false)
  

async function handleEnviar() {
  if (!motivoSeleccionado || !prioridadSeleccionada) return

  let id_institucion: number | null = null
  let institucionNueva: Institucion | null = null

  if (institucion) {
    if (institucion.id !== undefined && institucion.id !== -1) {
      id_institucion = institucion.id
    } else {
      institucionNueva = institucion
    }
  }

  const domicilioData = {
    nombre: adolescente.domicilio?.nombre,
    id_departamento: 520,
    domicilio_validado: adolescente.domicilio?.domicilio_validado,
  }

const familiaresData = familiares.map((familiar) => ({
  id: familiar.id,
  nombre: familiar.nombre,
  apellido: familiar.apellido,
  telefono: familiar.telefono,
  id_vinculo: familiar.vinculo?.id,
}))

  const referenciasInstitucionesData = referencias.map((referencia) => {
    if (referencia.id !== undefined && referencia.id !== -1) {
      return {
        id: referencia.id,
      }
    }

    return {
      nombre: referencia.nombre,
      id_tipo: referencia.tipo.id,
      telefono: referencia.telefono,
      correo: referencia.correo,
      domicilio: {
        nombre: referencia.domicilio?.nombre,
        id_departamento: referencia.domicilio?.departamento?.id,
        domicilio_validado: referencia.domicilio?.domicilio_validado,
      },
    }
  })

  const solicitud = {
    id_institucion,
    institucion: institucionNueva
      ? {
          nombre: institucionNueva.nombre,
          id_tipo: institucionNueva.tipo.id,
          telefono: institucionNueva.telefono,
          correo: institucionNueva.correo,
          domicilio: {
            nombre: institucionNueva.domicilio?.nombre,
            id_departamento:
              institucionNueva.domicilio?.departamento?.id,
            domicilio_validado:
              institucionNueva.domicilio?.domicilio_validado,
          },
        }
      : undefined,

    adolescente: {
      ...adolescente,
      domicilio: domicilioData,
      hermanos,
      familiares: familiaresData,
      referencias_instituciones_data: referenciasInstitucionesData,
    },

    solicitante,
    correo,
    telefono,
    id_motivo: motivoSeleccionado.id,
    id_prioridad: prioridadSeleccionada.id,
    descripcion,
    archivos: archivos.map((archivo) => archivo.contenido),
  }
    console.log("SOLICITUD",solicitud)
    try {
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
          <SolicitanteComponent
            solicitante={solicitante}
            setSolicitante={setSolicitante}
            finishSolicitante={finishSolicitante}
            setFinishSolicitante={setFinishSolicitante}
          />
          <InstitucionComponent
            institucion={institucion}
            setInstitucion={setInstitucion}
            finishInstitucion={finishInstitucion}
            setFinishInstitucion={setFinishInstitucion}
            correo={correo}
            setCorreo={setCorreo}
            telefono={telefono}
            setTelefono={setTelefono}
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
              !finishInstitucion || !finishSolicitante ||
              !finishAdolescente || !finishHermano || !finishFamiliar
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
import { useEffect } from "react"
import { Alert, Box, Button, Stack, Typography } from "@mui/material"
import AlertMessage from "@/common/components/AlertMessage"
import { Footer } from "@/common/layouts/Footer"
import { Header } from "@/common/layouts/Header"
import { ArchivoComponent } from "@/features/solicitud/components/Archivo/ArchivoComponent"
import { ContactoComponent } from "@/features/solicitud/components/Contacto/ContactoComponent"
import { SolicitudComponent } from "@/features/solicitud/components/SolicitudSection/SolicitudComponent"
import { AdolescentesSection } from "../../features/persona/componets/Adolescente/AdolescentesSection"
import { FamiliaresSection } from "@/features/persona/componets/Familiar/FamiliaresSection"
import { useSolicitudCreate } from "./useSolicitudCreate"
import { InstitucionComponent } from "@/features/domicilio/components/Institucion/InstitucionComponent"
import { ReferenciasSection } from "@/features/domicilio/components/Institucion/ReferenciasSection"

const grupo = { m: 0, p: 0, border: 0, minWidth: 0, width: "100%" }

export const CreatePage = () => {
  const form = useSolicitudCreate()
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }) }, [])

  return <>
    <Header />
    <Box sx={{ background: "linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%)", px: { xs: 1, sm: 3 }, py: 3 }}>
      <Stack spacing={3} sx={{ width: "100%", maxWidth: 1050, mx: "auto" }}>
        {form.enviado ? <Alert severity="success">La solicitud fue enviada correctamente.</Alert> : <>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Nueva solicitud</Typography>
            <Typography color="text.secondary">
              Completá la institución solicitante, los adolescentes, sus familiares y sus instituciones de referencia.
            </Typography>
          </Box>
          <Box component="fieldset" disabled={form.enviando} sx={grupo}>
            <Stack spacing={3}>
              <ContactoComponent 
                correo={form.correo}
                setCorreo={form.setCorreo}
                telefono={form.telefono}
                setTelefono={form.setTelefono}
                finishContacto={form.finishContacto}
                setFinishContacto={form.setFinishContacto}
              />
              <InstitucionComponent
                institucion={form.institucion}
                setInstitucion={form.setInstitucion}
                finishInstitucion={form.finishInstitucion}
                setFinishInstitucion={form.setFinishInstitucion}
              />
              <SolicitudComponent
                motivoSeleccionado={form.motivo}
                setMotivoSeleccionado={form.setMotivo}
                descripcion={form.descripcion}
                setDescripcion={form.setDescripcion}
                finishSolicitudSection={form.finishSolicitud}
                setFinishSolicitudSection={form.setFinishSolicitud}
              />
              <Box component="fieldset" disabled={form.editorFamiliar || form.editorReferencia !== null} sx={grupo}>
                <AdolescentesSection 
                  adolescentes={form.adolescentes} 
                  setAdolescentes={form.setAdolescentes}
                  editor={form.editorAdolescente}
                  setEditor={form.setEditorAdolescente}
                  domicilios={form.domicilios}
                  setDomicilios={form.setDomicilios}
                />
              </Box>
              <Box component="fieldset" disabled={form.editorAdolescente !== null || form.editorReferencia !== null} sx={grupo}>
                <FamiliaresSection 
                  adolescentes={form.adolescentes}
                  setAdolescentes={form.setAdolescentes}
                  editando={form.editorFamiliar}
                  setEditando={form.setEditorFamiliar}
                  domicilios={form.domicilios}
                />
              </Box>
              <Box component="fieldset" disabled={form.editorAdolescente !== null || form.editorFamiliar} sx={grupo}>
                <ReferenciasSection adolescentes={form.adolescentes} setAdolescentes={form.setAdolescentes}
                  editor={form.editorReferencia} setEditor={form.setEditorReferencia} />
              </Box>
              <ArchivoComponent archivos={form.archivos} setArchivos={form.setArchivos} />
            </Stack>
          </Box>
          {(form.editorAdolescente !== null || form.editorFamiliar || form.editorReferencia !== null) && <Alert severity="info">
            Guardá o cancelá el formulario en edición antes de enviar la solicitud.
          </Alert>}
          <Button variant="contained" onClick={form.enviar} disabled={!form.completo || form.enviando}
            sx={{ alignSelf: "center", minWidth: 200 }}>
            {form.enviando ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </>}
      </Stack>
      <AlertMessage open={form.alerta !== null} handleClose={() => form.setAlerta(null)}
        message={form.alerta?.mensaje ?? ""} severity={form.alerta?.severity ?? "error"} />
    </Box>
    <Footer />
  </>
}

export default CreatePage

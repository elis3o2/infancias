import { useState } from "react"
import type { AlertSeverity } from "@/common/types"
import { InstitucionInicial, type DomicilioFormData, type InstitucionFormData } from "@/features/domicilio/types"
import { postSolicitud } from "@/features/solicitud/api"
import type { Archivo, MotivoSolicitud } from "@/features/solicitud/types"
import { getSolicitudErrorMessage } from "@/features/solicitud/utils"
import { prepararAdolescentes, prepararInstitucion } from "./formPayload"
import type { AdolescenteFormulario } from "./formTypes"

export function useSolicitudCreate() {
  const [correo, setCorreo] = useState("")
  const [telefono, setTelefono] = useState("")
  const [finishContacto, setFinishContacto] = useState(false)
  const [adolescentes, setAdolescentes] = useState<AdolescenteFormulario[]>([])
  const [domicilios, setDomicilios] = useState<DomicilioFormData[]>([])
  const [editorAdolescente, setEditorAdolescente] = useState<string | null>("nuevo")
  const [editorFamiliar, setEditorFamiliar] = useState(false)
  const [editorReferencia, setEditorReferencia] = useState<string | null>(null)
  const [motivo, setMotivo] = useState<MotivoSolicitud | null>(null)
  const [descripcion, setDescripcion] = useState("")
  const [finishSolicitud, setFinishSolicitud] = useState(false)
  const [archivos, setArchivos] = useState<Archivo[]>([])
  const [alerta, setAlerta] = useState<{ mensaje: string; severity: AlertSeverity } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [institucion, setInstitucion] = useState<InstitucionFormData>(InstitucionInicial)
  const [finishInstitucion, setFinishInstitucion] = useState(false)
  const completo = finishContacto && finishSolicitud && finishInstitucion && adolescentes.length > 0 &&
    editorAdolescente === null && !editorFamiliar && editorReferencia === null


  async function enviar() {
    if (enviando || enviado) return
    if (!completo || !motivo) {
      setAlerta({ mensaje: "Completá las secciones y guardá o cancelá los formularios abiertos.", severity: "warning" })
      return
    }
    try {
      
      setEnviando(true)
      await postSolicitud({
        ...prepararAdolescentes(adolescentes),
        ...prepararInstitucion(institucion), correo, telefono, descripcion,
        id_motivo: motivo.id, archivos: archivos.map((archivo) => archivo.contenido),
      })
      setEnviado(true)
    } catch (error) {
      setAlerta({
        mensaje: getSolicitudErrorMessage(error, "No se pudo enviar la solicitud. Revisá los datos."),
        severity: "error",
      })
    } finally { setEnviando(false) }
  }

  return {
    correo, setCorreo, telefono, setTelefono, finishContacto, setFinishContacto,
    institucion, setInstitucion, finishInstitucion, setFinishInstitucion,
    adolescentes, setAdolescentes, domicilios, setDomicilios,
    editorAdolescente, setEditorAdolescente, editorFamiliar, setEditorFamiliar,
    editorReferencia, setEditorReferencia,
    motivo, setMotivo, descripcion, setDescripcion, finishSolicitud, setFinishSolicitud,
    archivos, setArchivos, alerta, setAlerta, enviando, enviado, completo, enviar,
  }
}

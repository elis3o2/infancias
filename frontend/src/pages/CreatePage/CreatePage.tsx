import { useState } from "react"
import { Box, Button} from '@mui/material'
import type { Adolescente, Familiar, Hermano, Solicitante } from "@/features/persona/types"
import { AdolescenteInicial, SolicitanteInicial } from "@/features/persona/types"
import type { Institucion, InstitucionCreate } from "@/features/domicilio/types"
import type { Archivo, MotivoSolicitud, PrioridadSolicitud, SolicitudCreate } from "@/features/solicitud/types"
import { SolicitanteComponent } from "@/features/persona/componets/Solicitante/SolicitanteComponent"
import { AdolescenteComponent } from "@/features/persona/componets/Adolescente/AdolescenteComponent"
import { SolicitudComponent } from "@/features/solicitud/components/SolicitudSection/SolicitudComponent"
import { HermanosComponent } from "@/features/persona/componets/Hermano/HermanoComponent"
import { FamiliaresComponent } from "@/features/persona/componets/Familiar/FamiliarComponent"
import { ArchivoComponent } from "@/features/solicitud/components/Archivo/ArchivoComponent"
import { RedComponent } from "@/features/solicitud/components/Redes/RedComponent"
import { InstitucionComponent } from "@/features/domicilio/components/Institucion/InstitucionComponent"
import { postSolicitud } from "@/features/solicitud/api"



export const CreatePage = () => {
  const [solicitante, setSolicitante] = useState<Solicitante>(SolicitanteInicial)
  const [finishSolicitante, setFinishSolicitante] = useState(false)
  const [institucion, setInstitucion] = useState<Institucion | InstitucionCreate | null>(null)
  const [finishInstitucion, setFinishInstitucion] = useState(false)
  const [adolescente, setAdolescente] = useState<Adolescente>(AdolescenteInicial)
  const [familiares, setFamiliares] = useState<Familiar[]>([])
  const [finishFamiliar, setFinishFamiliar] = useState(false)
  const [hermanos, setHermanos] = useState<Hermano[]>([])
  const [finishHermano, setFinishHermano] = useState(true)
  const [finishAdolescente, setFinishAdolescente] = useState(false)
  const [prioridadSeleccionada, setPrioridadSeleccionada] = useState<PrioridadSolicitud | null>(null)
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<MotivoSolicitud | null>(null)
  const [descripcion, setDescripcion] = useState("")
  const [archivos, setArchivos] = useState<Archivo[]>([])
  const [redes, setRedes] = useState<{educacion: Institucion | null;
                                    territorial: Institucion[];
                                    otros: Institucion[];
                                  }>({ educacion: null,
                                       territorial: [],
                                       otros: [] });

  console.log(!finishInstitucion)
  console.log(!finishSolicitante)
  console.log(!finishAdolescente)
  console.log(!finishHermano)
  console.log(!finishFamiliar)
  console.log("GI")
  console.log(hermanos)
  function handleEnviar() {
    let id_institucion: number | null = null;
    let institucionNueva: InstitucionCreate | null = null;

    if (institucion) {
      if ("id" in institucion) {
        id_institucion = institucion.id;
      } else {
        institucionNueva = institucion;
      }
    }

    let solicitud: SolicitudCreate = { 
      id_institucion,
      institucion: institucionNueva,
      adolescente: {...adolescente, hermanos, familiares},
      solicitante,
      id_motivo: motivoSeleccionado.id,
      id_prioridad: prioridadSeleccionada.id,
      descripcion,
      archivos: archivos.map((archivo)=> archivo.contenido)
    }

    console.log("SOLICITUD", solicitud)
  postSolicitud(solicitud)
  }


  return (
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
        <InstitucionComponent
          institucion={institucion}
          setInstitucion={setInstitucion}
          finishInstitucion={finishInstitucion}
          setFinishInstitucion={setFinishInstitucion}
        />
        <SolicitanteComponent
          solicitante={solicitante}
          setSolicitante={setSolicitante}
          finishSolicitante={finishSolicitante}
          setFinishSolicitante={setFinishSolicitante}
        />
        <AdolescenteComponent
          adolescente={adolescente}
          setAdolescente={setAdolescente}
          finishAdolescente={finishAdolescente}
          setFinishAdolescente={setFinishAdolescente}
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
        <SolicitudComponent
          prioridadSeleccionada={prioridadSeleccionada}
          setPrioridadSeleccionada={setPrioridadSeleccionada}
          motivoSeleccionado={motivoSeleccionado}
          setMotivoSeleccionado={setMotivoSeleccionado}
          descripcion={descripcion}
          setDescripcion={setDescripcion}
        />
        <ArchivoComponent archivos={archivos} setArchivos={setArchivos}/>
        <RedComponent redes={redes}/>
        <Button 
        variant="outlined" 
        onClick={() => handleEnviar()}
        disabled={!finishInstitucion || !finishSolicitante ||
          !finishAdolescente || !finishHermano || !finishFamiliar
         }>
          Enviar
        </Button>      

    </Box>)
}

export default CreatePage
import { useState } from "react"
import {Box} from '@mui/material'
import type { Adolescente, Familiar, Hermano, Solicitante } from "@/features/persona/types"
import type { Geolocalizacion, Institucion} from "@/features/domicilio/types"

import { LookInstitucion } from "@/features/domicilio/components/LookInstitucion"
import { SolicitanteComponent } from "@/features/persona/componets/Solicitante/SolicitanteComponent"
import { AdolescenteComponent } from "@/features/persona/componets/Adolescente/AdolescenteComponent"
import { SolicitudComponent } from "@/features/solicitud/components/SolicitudSection/SolicitudComponent"
import type { MotivoSolicitud, PrioridadSolicitud } from "@/features/solicitud/types"
import { HermanosComponent } from "@/features/persona/componets/Hermano/HermanoComponent"
import { FamiliaresComponent } from "@/features/persona/componets/Familiar/FamiliarComponent"
import { ArchivoComponent } from "@/features/solicitud/components/Archivo/ArchivoComponent"

export const CreatePage = () => {
  const [solicitante, setSolicitante] = useState<Solicitante | null>(null)
  const [finishSolicitante, setFinishSolicitante] = useState(false)
  const [geoSeleccionada, setGeoSeleccionada] = useState<Geolocalizacion | null>(null)
  const [institucion, setInstitucion] = useState<Institucion | null>(null)
  const [adolescente, setAdolescente] = useState<Adolescente | null>(null)
  const [finishAdolescente, setFinishAdolescente] = useState(false)
  const [prioridadSeleccionada, setPrioridadSeleccionada] = useState<PrioridadSolicitud | null>(null)
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<MotivoSolicitud | null>(null)
  const [descripcion, setDescripcion] = useState("")
  const [hermanos, setHermanos] = useState<Hermano[]>([])
  const [familiares, setFamiliares] = useState<Familiar[]>([])
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
        <LookInstitucion
          institucion={institucion}
          setInstitucion={setInstitucion}
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
      />
      <HermanosComponent
        hermanos={hermanos}
        setHermanos={setHermanos}
      />
      <SolicitudComponent
        prioridadSeleccionada={prioridadSeleccionada}
        setPrioridadSeleccionada={setPrioridadSeleccionada}
        motivoSeleccionado={motivoSeleccionado}
        setMotivoSeleccionado={setMotivoSeleccionado}
        descripcion={descripcion}
        setDescripcion={setDescripcion}
      />
      <ArchivoComponent
      />

    </Box>)
}

export default CreatePage
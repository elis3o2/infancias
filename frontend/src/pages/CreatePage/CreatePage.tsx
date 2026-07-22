import { useState } from "react"
import {Box} from '@mui/material'
import { PersonaComponent } from "../../features/persona/componets/PersonaComponent.tsx/PersonaComponent"
import type { CCB, Escolaridad, Persona, Salud } from "@/features/persona/types"
import type { Geolocalizacion, Institucion} from "@/features/domicilio/types"
import { EscolaridadComponent } from "../../features/persona/componets/EscolaridadComponet/EscolaridadComponent"
import type { DatosProgenitor } from "@/features/persona/types"

import { LookInstitucion } from "@/features/domicilio/components/LookInstitucion"

export const CreatePage = () => {
  const [finishPersona, setFinishPersona] = useState(false)
  const [persona, setPersona] = useState<Persona | null>(null)
  const [geoSeleccionada, setGeoSeleccionada] = useState<Geolocalizacion | null>(null)
  const [escolarizado, setEscolarizado] = useState(true)
  const [escolaridadSeleccionada, setEscolaridadSeleccionada] = useState<Escolaridad | null>(null)
  const [escuela, setEscuela] = useState("")
  const [finishEscolaridad, setFinishEscolaridad] = useState(false)
  const [salud, setSalud] = useState<Salud>({adscripcion: [], efectores: [], obra_social:[]})
  const [padre, setPadre] = useState<DatosProgenitor> ({persona: null, vivo: true, convive:true})
  const [madre, setMadre] = useState<DatosProgenitor> ({persona: null, vivo: true, convive:true})
  const [ccbSeleccionado, setCcbSeleccionado] = useState<CCB | null>(null)
  const [institucion, setInstitucion] = useState<Institucion | null>(null)

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
          setInstitucion={setInstitucion}
        />
      <PersonaComponent
        setPersona={setPersona}
        geoSeleccionada={geoSeleccionada}
        setGeoSeleccionada={setGeoSeleccionada}
        setFinishPersona={setFinishPersona}
      />
      {(finishPersona || finishEscolaridad) && (
        <EscolaridadComponent
          escolarizado={escolarizado}
          setEscolarizado={setEscolarizado}
          escolaridadSeleccionada={escolaridadSeleccionada}
          setEscolaridadSeleccionada={setEscolaridadSeleccionada}
          escuela={escuela}
          setEscuela={setEscuela}
          finishEscolaridad={finishEscolaridad}
          setFinishEscolaridad={setFinishEscolaridad}
        />
      ) }
    </Box>)
}

export default CreatePage
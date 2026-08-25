import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AceptarButtons } from "./AceptarButtons";
import type { PrioridadSolicitud,  SolicitudCrud } from "../../types"
import { rechazarSolicitud, validarSolicitud  } from "../../api"
import type { Ciudadano, PersonaCreate } from "@/features/persona/types"
import { TextField } from "@mui/material"
import { PrioridadSelector } from "../PrioridadSelector"
import { ValidarAdolescente } from "@/features/persona/componets/Validar/ValidarAdolescente"
import { ContactoCard } from "../Contacto/ContactoCard";
import { InstitucionCard } from "@/features/domicilio/components/Institucion/InstitucionCard";
import { ValidarFamiliares } from "@/features/persona/componets/Validar/ValidarFamiliares";
import { ValidarHermanos } from "@/features/persona/componets/Validar/ValidarHermanos";
import { DescripcionCard } from "../SolicitudSection/DescripcionCard";
import { ArchivoVistaCard } from "../Archivo/ArchivoVistaCard";
import { InstitucionesCard } from "@/features/domicilio/components/Institucion/InstitucionesCard";
import { formAdolescenteWrite } from "@/features/persona/utils";


type Props = {
    solicitud: SolicitudCrud
}
const MAX_DESCRIPCION = 256

export const SolicitudValidar = ({solicitud} : Props) => {
    const navigate = useNavigate()
    const [personaAdolescente, setPersonaAdolescente] = useState<PersonaCreate | null>(null)
    const [estadoAdolescente, setEstadoAdolescente] = useState<null | "confirmado" | "rechazado">(null)
    const [personasHermanos, setPersonasHermanos] = useState<(PersonaCreate | null)[]>([])
    const [estadosHermanos, setEstadosHermanos] = useState<(null | "confirmado" | "rechazado")[]>([])
    const [hermanosNuevos, setHermanosNuevos] = useState<PersonaCreate[]>([])
    const [personasFamiliares, setPersonasFamiliares] = useState<(PersonaCreate | null)[]>([])
    const [estadosFamiliares, setEstadosFamiliares] = useState<(null | "confirmado" | "rechazado")[]>([])
    const [familiaresNuevos, setFamiliaresNuevos] = useState<PersonaCreate[]>([])
    const [nuevaDescripcion, setNuevaDescripcion] = useState("") 
    const [nuevaPrioridad, setNuevaPrioridad] = useState<PrioridadSolicitud>(solicitud.prioridad)


    const hayHermanosSinResolver = estadosHermanos.some((e) => e == null)
    const disabledConfirmar = estadoAdolescente !== "confirmado" || hayHermanosSinResolver || !personaAdolescente
    const disabledRechazar = estadoAdolescente == null || hayHermanosSinResolver 
    

    console.log(solicitud)
    useEffect(() => {
        if (!solicitud) return
        const listaNullHer = solicitud.adolescente.hermanos.map(() => null) 
        setEstadosHermanos(listaNullHer)
        setPersonasHermanos(listaNullHer)
 
        const listaNullFam = solicitud.adolescente.familiares.map(() => null) 
        setEstadosFamiliares(listaNullFam)
        setPersonasFamiliares(listaNullFam)
    }, [solicitud])

    async function rechazar(motivo: string) {
        await rechazarSolicitud(solicitud.id, motivo)
        navigate(`/solicitud/`)
    }

    function aceptar () {
        if (!personaAdolescente) return
        const adolescenteWrite = formAdolescenteWrite(personaAdolescente, personasHermanos.filter((p)=> p!= null), hermanosNuevos,
            personasFamiliares.filter((p)=> p!= null), familiaresNuevos)
        validarSolicitud(solicitud.id, nuevaDescripcion, nuevaPrioridad.id, adolescenteWrite)
        navigate(`/solicitud/`)
    }
    


    return (<>
        <ContactoCard
            telefono={solicitud.telefono}
            correo={solicitud.correo}
        />
        <InstitucionCard institucion={solicitud.institucion}/>
        <ValidarAdolescente
            adolescente={solicitud.adolescente}
            estado={estadoAdolescente}
            setEstado={setEstadoAdolescente}
            persona={personaAdolescente}     
            setPersona={setPersonaAdolescente}
        />
        <ValidarFamiliares
            familiares={solicitud.adolescente.familiares}
            estados={estadosFamiliares}
            setEstados={setEstadosFamiliares}
            personas={personasFamiliares}
            setPersonas={setPersonasFamiliares}
            nuevosFamiliares={familiaresNuevos}
            setNuevosFamiliares={setFamiliaresNuevos}
        />
        <ValidarHermanos
            hermanos={solicitud.adolescente.hermanos}
            estados={estadosHermanos}
            setEstados={setEstadosHermanos}
            personas={personasHermanos}
            setPersonas={setPersonasHermanos}
            nuevosHermanos={hermanosNuevos}
            setNuevosHermanos={setHermanosNuevos}
        />
        <DescripcionCard nombre="Descripción" texto={solicitud.descripcion}/>
        
        <TextField
            label="Agregar más información"
            value={nuevaDescripcion}
            onChange={(e) => setNuevaDescripcion(e.target.value.slice(0, MAX_DESCRIPCION))}
            multiline
            minRows={3}
            fullWidth
            helperText={`${nuevaDescripcion.length}/${MAX_DESCRIPCION}`}
          />

        <ArchivoVistaCard
            archivos={solicitud.archivos}
        />
         
        {solicitud.adolescente.referencias_instituciones.length > 0  &&
                <InstitucionesCard instituciones={solicitud.adolescente.referencias_instituciones}/>
            }
        <PrioridadSelector prioridad={nuevaPrioridad} setPrioridad={setNuevaPrioridad} />
        <AceptarButtons disabledConfirmar={disabledConfirmar} disabledRechazar={disabledRechazar} onConfirmar={aceptar} onRechazar={rechazar} />

    </>)
}
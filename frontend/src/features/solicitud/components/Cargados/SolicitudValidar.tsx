import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AceptarButtons } from "./AceptarButtons";
import type { PrioridadSolicitud,  SolicitudCrud } from "../../types"
import { rechazarSolicitud  } from "../../api"
import type { Ciudadano, Persona } from "@/features/persona/types"
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


type Props = {
    solicitud: SolicitudCrud
}
const MAX_DESCRIPCION = 256

export const SolicitudValidar = ({solicitud} : Props) => {
    const navigate = useNavigate()
    const [ciudadanoAdolescente, setCiudadanoAdolescente] = useState<Ciudadano | null>(null)
    const [estadoAdolescente, setEstadoAdolescente] = useState<null | "confirmado" | "rechazado">(null)
    const [ciudadanosHermanos, setCiudadanosHermanos] = useState<(Ciudadano | null)[]>([])
    const [estadosHermanos, setEstadosHermanos] = useState<(null | "confirmado" | "rechazado")[]>([])
    const [hermanosNuevos, setHermanosNuevos] = useState<Persona[]>([])
    const [ciudadanosFamiliares, setCiudadanosFamiliares] = useState<(Ciudadano | null)[]>([])
    const [estadosFamiliares, setEstadosFamiliares] = useState<(null | "confirmado" | "rechazado")[]>([])
    const [familiaresNuevos, setFamiliaresNuevos] = useState<Persona[]>([])
    const [nuevaDescripcion, setNuevaDescripcion] = useState("") 
    const [nuevaPrioridad, setNuevaPrioridad] = useState<PrioridadSolicitud>(solicitud.prioridad)


    const hayHermanosSinResolver = estadosHermanos.some((e) => e == null)
    const disabledConfirmar = estadoAdolescente !== "confirmado" || hayHermanosSinResolver || !ciudadanoAdolescente
    const disabledRechazar = estadoAdolescente == null || hayHermanosSinResolver 
    


    useEffect(() => {
        if (!solicitud) return
        const listaNullHer = solicitud.adolescente.hermanos.map(() => null) 
        setEstadosHermanos(listaNullHer)
        setCiudadanosHermanos(listaNullHer)
 
        const listaNullFam = solicitud.adolescente.familiares.map(() => null) 
        setEstadosHermanos(listaNullFam)
        setCiudadanosHermanos(listaNullFam)
    }, [solicitud])

    async function rechazar(motivo: string) {
        await rechazarSolicitud(solicitud.id, motivo)
        navigate(`/solicitud/`)
    }

    function aceptar () {
        
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
            ciudadano={ciudadanoAdolescente}     
            setCiudadano={setCiudadanoAdolescente}
        />
        <ValidarFamiliares
            familiares={solicitud.adolescente.familiares}
            estados={estadosFamiliares}
            setEstados={setEstadosFamiliares}
            ciudadanos={ciudadanosFamiliares}
            setCiudadanos={setCiudadanosFamiliares}
            nuevosFamiliares={familiaresNuevos}
            setNuevosFamiliares={setFamiliaresNuevos}
        />
        <ValidarHermanos
            hermanos={solicitud.adolescente.hermanos}
            estados={estadosHermanos}
            setEstados={setEstadosHermanos}
            ciudadanos={ciudadanosHermanos}
            setCiudadanos={setCiudadanosHermanos}
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
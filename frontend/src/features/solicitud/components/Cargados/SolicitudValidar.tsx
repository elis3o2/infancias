import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AdolescenteCard } from "@/features/persona/componets/Adolescente/AdolescenteCard"
import { SolicitanteCard } from "@/features/persona/componets/Solicitante/SolicitanteCard"
import { InstitucionCard } from "@/features/domicilio/components/Institucion/InstitucionCard"
import { DescripcionCard } from "../SolicitudSection/SolicitudCard"
import { FamiliaresCard } from "@/features/persona/componets/Familiar/FamiliarCard"
import { HermanoCard } from "@/features/persona/componets/Hermano/HermanoCard";
import { ArchivoCard } from "../Archivo/ArchivoCard";
import { AceptarButtons } from "./AceptarButtons";
import type { Solicitud } from "../../types"
import { validarSolicitud, rechazarSolicitud  } from "../../api"
import { postAdolescenteValidado, postHermanoValidado } from "@/features/persona/api"
import type { Ciudadano } from "@/features/persona/types"
import { ReferenciaCard } from "../Redes/ReferenciaCard"

type Props = {
    solicitud: Solicitud
}


export const SolicitudValidar = ({solicitud} : Props) => {
    const navigate = useNavigate()
    const [ciudadanoAdolescente, setCiudadanoAdolescente] = useState<Ciudadano | null>(null)
    const [ciudadanosHermanos, setCiudadanosHermanos] = useState<(Ciudadano | null)[]>([])
    const [estadoAdolescente, setEstadoAdolescente] = useState<null | "confirmado" | "rechazado">(null)
    const [estadosHermanos, setEstadosHermanos] = useState<(null | "confirmado" | "rechazado")[]>([])
    
    const hayHermanosSinResolver = estadosHermanos.some((e) => e == null)
    const disabledConfirmar = estadoAdolescente !== "confirmado" || hayHermanosSinResolver || !ciudadanoAdolescente
    const disabledRechazar = estadoAdolescente == null || hayHermanosSinResolver 

    
    function formatFecha(fecha: string): string {
    const d = new Date(fecha)

    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, "0")
    const day = String(d.getUTCDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
    }
    console.log(solicitud)
    useEffect(() => {
        if (!solicitud) return
        const listaNull = solicitud.adolescente.hermanos.map(() => null) 
        setEstadosHermanos(listaNull)
        setCiudadanosHermanos(listaNull)
    }, [solicitud])
    
    async function aceptar(idDerivacion: number) {    
        
        if (!ciudadanoAdolescente || !(estadoAdolescente == "confirmado")) return
    
        await validarSolicitud(solicitud.id, idDerivacion)
        await postAdolescenteValidado(solicitud.adolescente.id, ciudadanoAdolescente.sexo, ciudadanoAdolescente.nroDocumento,
                            ciudadanoAdolescente.nombre, ciudadanoAdolescente.apellido, formatFecha(ciudadanoAdolescente.fechaNacimiento))
                        
        const promesas: Promise<unknown>[] = []

        for (let i = 0; i < solicitud.adolescente.hermanos.length; i++) {
            if (estadosHermanos[i] !== "confirmado") continue

            const ciudadano = ciudadanosHermanos[i]
            if (ciudadano == null) continue

            promesas.push(
                postHermanoValidado(
                solicitud.adolescente.hermanos[i].id,
                ciudadano.sexo,
                ciudadano.nroDocumento,
                ciudadano.nombre,
                ciudadano.apellido,
               formatFecha(ciudadano.fechaNacimiento)
                )
            )
        }
        await Promise.all(promesas)
        navigate(`/solicitud/`)
    }
    

    async function rechazar(motivo: string) {
        await rechazarSolicitud(solicitud.id, motivo)
        navigate(`/solicitud/`)
    }


    return (<>
        <InstitucionCard institucion={solicitud.institucion}/>
        <SolicitanteCard solicitante={solicitud.solicitante}/>
        <AdolescenteCard
            adolescente={solicitud.adolescente}
            estado={estadoAdolescente}
            setEstado={setEstadoAdolescente}
            ciudadano={ciudadanoAdolescente}
            setCiudadano={setCiudadanoAdolescente}
        />
        <FamiliaresCard familiares={solicitud.adolescente.familiares}/>
        <HermanoCard 
            hermanos={solicitud.adolescente.hermanos}
            estados={estadosHermanos}
            setEstados={setEstadosHermanos}
            ciudadanos={ciudadanosHermanos}
            setCiudadanos={setCiudadanosHermanos}
        />
        <DescripcionCard descripcion={solicitud.descripcion}/>
        <ArchivoCard archivos={solicitud.archivos}/>
        {solicitud.adolescente.referencias_gubernamentales.length > 0 &&
        <ReferenciaCard 
            referencias={solicitud.adolescente.referencias_gubernamentales} 
            nombre="Instituciones gubernamentales de referencia"
        /> }
        {solicitud.adolescente.referencias_no_gubernamentales.length > 0 &&
        <ReferenciaCard 
            referencias={solicitud.adolescente.referencias_no_gubernamentales} 
            nombre="Instituciones no gubernamentales de referencia"
        /> }
        <AceptarButtons disabledConfirmar={disabledConfirmar} disabledRechazar={disabledRechazar} onConfirmar={aceptar} onRechazar={rechazar} />

    </>)
}
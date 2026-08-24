import { SolicitudCard } from "../SolicitudSection/SolicitudCard"
import { ArchivoCard } from "../Archivo/ArchivoCard";
import { AdolescenteValidadoCard } from "@/features/persona/componets/Adolescente/AdolescenteValidadoCard"
import { HermanoValidadoCard } from "@/features/persona/componets/Hermano/HermanoValidadoCard"
import { ArchivoVistaCard } from "../Archivo/ArchivoVistaCard";
type Props = {
    solicitud: Solicitud
}


export const SolicitudValidada = ({solicitud} : Props) => {
    return (<>
        <InstitucionCard institucion={solicitud.institucion}/>
        <SolicitanteCard solicitante={solicitud.solicitante}/>
        {solicitud.rechazado?
        <AdolescenteValidadoCard
            adolescente={solicitud.adolescente} adolescente_validao={solicitud.adolescente}
        /> :
        <AdolescenteValidadoCard
            adolescente={solicitud.adolescente} adolescente_validao={solicitud.adolescente.adolescente_validado}
        />}
        <FamiliaresCard familiares={solicitud.adolescente.familiares}/>
        { solicitud.rechazado && solicitud.adolescente.hermanos.length > 0 &&
        <HermanoValidadoCard
            hermanos={solicitud.adolescente.hermanos}
        /> }
        { !solicitud.rechazado && solicitud.adolescente.hermanos_validados.length > 0 &&
        <HermanoValidadoCard
            hermanos={solicitud.adolescente.hermanos_validados}
        />}
        <SolicitudCard descripcion={solicitud.descripcion}/>
        <SolicitudCard descripcion={solicitud.descripcion_extra} />
        <ArchivoVistaCard archivos={solicitud.archivos}/>
        {solicitud.adolescente.referencias_instituciones.length > 0 &&
        <InstitucionesCard
            instituciones={solicitud.adolescente.referencias_instituciones} 
        />}
    </>)
}
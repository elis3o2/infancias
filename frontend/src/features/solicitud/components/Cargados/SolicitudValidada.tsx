import { SolicitanteCard } from "@/features/persona/componets/Solicitante/SolicitanteCard"
import { InstitucionCard } from "@/features/domicilio/components/Institucion/InstitucionCard"
import { DescripcionCard } from "../SolicitudSection/SolicitudCard"
import { FamiliaresCard } from "@/features/persona/componets/Familiar/FamiliarCard"
import { ArchivoCard } from "../Archivo/ArchivoCard";
import type { Solicitud } from "../../types"
import { AdolescenteValidadoCard } from "@/features/persona/componets/Adolescente/AdolescenteValidadoCard"
import { HermanoValidadoCard } from "@/features/persona/componets/Hermano/HermanoValidadoCard"
import { ReferenciaCard } from "../Redes/ReferenciaCard";

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
        /> }{ !solicitud.rechazado && solicitud.adolescente.hermanos_validados.length > 0 &&
        <HermanoValidadoCard
            hermanos={solicitud.adolescente.hermanos_validados}
        />}
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
        />}
    </>)
}
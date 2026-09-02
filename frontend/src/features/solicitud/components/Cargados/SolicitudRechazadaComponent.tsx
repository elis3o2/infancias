import { ContactoCard } from "../Contacto/ContactoCard"
import { InstitucionCard } from "@/features/domicilio/components/Institucion/InstitucionCard"
import { DescripcionCard } from "../SolicitudSection/DescripcionCard"
import { ArchivoVistaCard } from "../Archivo/ArchivoVistaCard"
import { InstitucionesCard } from "@/features/domicilio/components/Institucion/InstitucionesCard"
import type { SolicitudRechazada } from "../../types"
import { HermanosCard } from "@/features/persona/componets/Hermano/HermanosCard"
import { FamiliaresCard } from "@/features/persona/componets/Familiar/FamiliaresCard"
import { AdolescenteCard } from "@/features/persona/componets/Adolescente/AdolescenteCard"


type Props = {
    solicitud: SolicitudRechazada
}

export const SolicitudRechazadaComponent = ({ solicitud }: Props) => {

    return (
        <>
            <ContactoCard
                telefono={solicitud.telefono}
                correo={solicitud.correo}
            />

            <InstitucionCard
                institucion={solicitud.institucion}
            />

            <AdolescenteCard
                adolescente={solicitud.adolescente}
            />

            {solicitud.adolescente.hermanos.length > 0 && (
                <HermanosCard
                    hermanos={solicitud.adolescente.hermanos}
                />
            )}
            
            {solicitud.adolescente.familiares.length > 0 && (
                <FamiliaresCard
                    familiares={solicitud.adolescente.familiares}
                />
            )}

            <DescripcionCard
                nombre="Descripción"
                texto={solicitud.descripcion}
            />


            <ArchivoVistaCard
                archivos={solicitud.archivos}
            />

            {solicitud.adolescente.referencias_instituciones.length > 0 && (
                <InstitucionesCard
                    instituciones={
                        solicitud.adolescente.referencias_instituciones
                    }
                />
            )}
    </>
    )
}
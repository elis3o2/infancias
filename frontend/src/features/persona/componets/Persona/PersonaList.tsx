import type { Persona, PersonaCreate } from "../../types";
import { ListData } from "@/common/components/ListData";


type Props = {
    persona : Persona | PersonaCreate
}

export const PersonaList = ({ persona }: Props) => {
    return (
        <ListData
            nombre={persona.nombre}
            dni={persona.dni}
            sexo={persona.sexo}
            apellido={persona.apellido}
            fecha_nacimiento={persona.fecha_nacimiento}
            {...(persona.vinculo ? { vinculo: persona.vinculo.nombre } : {})}
            {...(persona.telefono ? { telefono: persona.telefono } : {})}
            {...(persona.domicilio ? { domicilio: persona.domicilio.nombre } : {})}
        />
    )
}
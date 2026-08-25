import { useState } from "react"

import { ContactoCard } from "../Contacto/ContactoCard"
import { InstitucionCard } from "@/features/domicilio/components/Institucion/InstitucionCard"
import { DescripcionCard } from "../SolicitudSection/DescripcionCard"
import { ArchivoVistaCard } from "../Archivo/ArchivoVistaCard"
import { InstitucionesCard } from "@/features/domicilio/components/Institucion/InstitucionesCard"

import type { Solicitud } from "../../types"

import { PersonaCard } from "@/features/persona/componets/Validar/PersonaCard"
import { PersonasCard } from "@/features/persona/componets/Validar/PersonasCard"
import { HermanosCard } from "@/features/persona/componets/Hermano/HermanosCard"
import { FamiliaresCard } from "@/features/persona/componets/Familiar/FamiliaresCard"

import EquipoSelect from "../EquipoForm"
import { derivarSolicitud } from "../../api"

import {
    Button,
    Stack,
} from "@mui/material"

type Props = {
    solicitud: Solicitud
}

export const SolicitudValidada = ({ solicitud }: Props) => {

    const [equipoId, setEquipoId] = useState<number | null>(null)
    const [derivando, setDerivando] = useState(false)

    const handleDerivar = async () => {
        if (equipoId === null) return

        try {
            setDerivando(true)

            await derivarSolicitud(
                solicitud.id,
                equipoId,
            )

        } finally {
            setDerivando(false)
        }
    }

    return (
        <>
            <ContactoCard
                telefono={solicitud.telefono}
                correo={solicitud.correo}
            />

            <InstitucionCard
                institucion={solicitud.institucion}
            />

            <PersonaCard
                persona={solicitud.adolescente.persona}
                titulo="Datos del niño, niña o Adolescente"
            />

            {solicitud.adolescente.hermanos_validados.length > 0 && (
                <PersonasCard
                    personas={solicitud.adolescente.hermanos_validados}
                    titulo="Hermanos validados"
                />
            )}

            {solicitud.adolescente.hermanos.length > 0 && (
                <HermanosCard
                    hermanos={solicitud.adolescente.hermanos}
                />
            )}

            {solicitud.adolescente.familiares_validados.length > 0 && (
                <PersonasCard
                    personas={solicitud.adolescente.familiares_validados}
                    titulo="Familiares/referentes validados"
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

            {solicitud.descripcion_extra && (
                <DescripcionCard
                    nombre="Información agregada"
                    texto={solicitud.descripcion_extra}
                />
            )}

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

            {solicitud.equipo === 2 && (
                <Stack
                    spacing={2}
                    sx={{ mt: 2 }}
                >
                    <EquipoSelect
                        equipoId={equipoId}
                        onChange={setEquipoId}
                    />

                    <Button
                        variant="contained"
                        onClick={handleDerivar}
                        disabled={equipoId === null || derivando}
                    >
                        {derivando ? "Derivando..." : "Derivar"}
                    </Button>
                </Stack>
            )}
        </>
    )
}
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AceptarButtons } from "./AceptarButtons"
import type { SolicitudCrud } from "../../types"
import { rechazarSolicitud, validarSolicitud } from "../../api"
import type { PersonaCreate } from "@/features/persona/types"
import { TextField } from "@mui/material"
import { ValidarAdolescente } from "@/features/persona/componets/Validar/ValidarAdolescente"
import { ContactoCard } from "../Contacto/ContactoCard"
import { InstitucionCard } from "@/features/domicilio/components/Institucion/InstitucionCard"
import { ValidarFamiliares } from "@/features/persona/componets/Validar/ValidarFamiliares"
import { ValidarHermanos } from "@/features/persona/componets/Validar/ValidarHermanos"
import { DescripcionCard } from "../SolicitudSection/DescripcionCard"
import { ArchivoVistaCard } from "../Archivo/ArchivoVistaCard"
import { InstitucionesCard } from "@/features/domicilio/components/Institucion/InstitucionesCard"
import { formAdolescenteWrite } from "@/features/persona/utils"
import type { AlertSeverity } from "@/common/types"
import AlertMessage from "@/common/components/AlertMessage"

type Props = {
    solicitud: SolicitudCrud
}

const MAX_DESCRIPCION = 256

export const SolicitudValidar = ({ solicitud }: Props) => {
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
    const [alertOpen, setAlertOpen] = useState(false)
    const [alertMessage, setAlertMessage] = useState("")
    const [alertSeverity, setAlertSeverity] =useState<AlertSeverity>("success")
    
    const hayHermanosSinResolver = estadosHermanos.some((e) => e == null)
    const disabledConfirmar = estadoAdolescente !== "confirmado" ||
                                hayHermanosSinResolver ||
                                !personaAdolescente

    const disabledRechazar = estadoAdolescente == null || hayHermanosSinResolver

    useEffect(() => {
        if (!solicitud) return

        const listaNullHer = solicitud.adolescente.hermanos.map(() => null)

        setEstadosHermanos(listaNullHer)
        setPersonasHermanos(listaNullHer)

        const listaNullFam = solicitud.adolescente.familiares.map(() => null)

        setEstadosFamiliares(listaNullFam)
        setPersonasFamiliares(listaNullFam)
    }, [solicitud])


    const mostrarAlerta = ( message: string, severity: AlertSeverity) => {
        setAlertMessage(message)
        setAlertSeverity(severity)
        setAlertOpen(true)
    }

    const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    async function rechazar(motivo: string) {
        try {
            await rechazarSolicitud(solicitud.id, motivo)

            mostrarAlerta(
                "La solicitud fue rechazada correctamente.",
                "success"
            )

            await esperar(3000)

            navigate("/solicitud/")
        } catch (error) {
            console.error(error)

            mostrarAlerta(
                "No se pudo rechazar la solicitud.",
                "error"
            )
        }
    }

    async function aceptar() {
        if (!personaAdolescente) return

        const adolescenteWrite = formAdolescenteWrite(
            personaAdolescente,
            personasHermanos.filter((p) => p != null),
            hermanosNuevos,
            personasFamiliares.filter((p) => p != null),
            familiaresNuevos
        )

        try {
            await validarSolicitud(
                solicitud.id,
                nuevaDescripcion,
                adolescenteWrite
            )

            mostrarAlerta(
                "La solicitud fue validada correctamente.",
                "success"
            )

            await esperar(3000)

            navigate("/solicitud/")
        } catch (error) {
            console.error(error)

            mostrarAlerta(
                "No se pudo validar la solicitud.",
                "error"
            )
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

            <DescripcionCard
                nombre="Descripción"
                texto={solicitud.descripcion}
            />

            <TextField
                label="Agregar más información"
                value={nuevaDescripcion}
                onChange={(e) =>
                    setNuevaDescripcion(
                        e.target.value.slice(0, MAX_DESCRIPCION)
                    )
                }
                multiline
                sx={{ minWidth: 1028 }}
                minRows={3}
                fullWidth
                helperText={`${nuevaDescripcion.length}/${MAX_DESCRIPCION}`}
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

            <AceptarButtons
                disabledConfirmar={disabledConfirmar}
                disabledRechazar={disabledRechazar}
                onConfirmar={aceptar}
                onRechazar={rechazar}
            />

            <AlertMessage
                open={alertOpen}
                handleClose={() => setAlertOpen(false)}
                message={alertMessage}
                severity={alertSeverity}
            />
        </>
    )
}
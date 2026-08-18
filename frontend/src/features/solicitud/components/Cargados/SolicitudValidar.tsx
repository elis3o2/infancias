import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AdolescenteCard } from "@/features/persona/componets/Adolescente/AdolescenteCard"
import { SolicitanteCard } from "@/features/persona/componets/Solicitante/SolicitanteCard"
import { InstitucionCard } from "@/features/domicilio/components/Institucion/InstitucionCard"
import { SolicitudCard } from "../SolicitudSection/SolicitudCard"
import { HermanoCard } from "@/features/persona/componets/Hermano/HermanoCard";
import { ArchivoCard } from "../Archivo/ArchivoCard";
import { AceptarButtons } from "./AceptarButtons";
import type { PrioridadSolicitud, Solicitud } from "../../types"
import { validarSolicitud, rechazarSolicitud  } from "../../api"
import type { Ciudadano, Familiar, Hermano } from "@/features/persona/types"
import { InstitucionesCard } from "../Redes/InstitucionesCard"
import type { ArchivoPendiente } from "../../types"
import { ArchivoNuevoCard } from "../Archivo/ArchivoNuevoCard"
import { TextField } from "@mui/material"
import { PrioridadSelector } from "../PrioridadSelector"
import type { Domicilio } from "@/features/domicilio/types"
import { FamiliaresEditarCard } from "@/features/persona/componets/Familiar/FamiliarEditarCard"
import { FamiliaresNuevos } from "@/features/persona/componets/Familiar/FamiliaresNuevos"


type Props = {
    solicitud: Solicitud
}
const MAX_DESCRIPCION = 256

export const SolicitudValidar = ({solicitud} : Props) => {
    const navigate = useNavigate()
    const [ciudadanoAdolescente, setCiudadanoAdolescente] = useState<Ciudadano | null>(null)
    const [ciudadanosHermanos, setCiudadanosHermanos] = useState<(Ciudadano | null)[]>([])
    const [estadoAdolescente, setEstadoAdolescente] = useState<null | "confirmado" | "rechazado">(null)
    const [estadosHermanos, setEstadosHermanos] = useState<(null | "confirmado" | "rechazado")[]>([])
    const [hermanosNuevos, setHermanosNuevos] = useState<Hermano[]>([])
    const [archivoSeleccionado, setArchivoSeleccionado] = useState<Set<number>>(() => new Set(solicitud.archivos.map((m) => m.id)))
    const [archivosNuevos, setArchivosNuevos] = useState<ArchivoPendiente[]>([])
    const [nuevaDescripcion, setNuevaDescripcion] = useState("") 
    const [nuevaPrioridad, setNuevaPrioridad] = useState<PrioridadSolicitud>(solicitud.prioridad)
    const [nuevoDomicilio, setNuevoDomicilio] = useState<Domicilio | null>(null)
    const [familiarSeleccionado, setFamiliarSeleccionado] = useState<Set<number>>(() => new Set(solicitud.adolescente.familiares.map((m) => m.id)))
    const [familiaresNuevos, setFamiliaresNuevos] = useState<Familiar[]>([])

    const hayHermanosSinResolver = estadosHermanos.some((e) => e == null)
    const disabledConfirmar = estadoAdolescente !== "confirmado" || hayHermanosSinResolver || !ciudadanoAdolescente
    const disabledRechazar = estadoAdolescente == null || hayHermanosSinResolver 

    
    function formatFecha(fecha: string): string {
    const d = new Date(fecha)

    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, "0")
    const day = String(d.getUTCDate()).padStart(2, "0")
        console.log(solicitud)
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
        if (ciudadanoAdolescente == null) return

        const adolescenteData: any = {
            adolescente_validado: {
            nombre: ciudadanoAdolescente.nombre,
            apellido: ciudadanoAdolescente.apellido,
            fecha_nacimiento: formatFecha(ciudadanoAdolescente.fechaNacimiento),
            sexo: ciudadanoAdolescente.sexo,
            dni: ciudadanoAdolescente.nroDocumento,
            },
        }

    // ---- Domicilio ----
    // si el usuario cambió el domicilio (CambiarDomicilio), ya viene completo y listo para mandar tal cual
    if (nuevoDomicilio) {
        adolescenteData.domicilio_extra = nuevoDomicilio
    }

    // ---- Familiares nuevos (cargados con AgregarFamiliar) ----
    if (familiaresNuevos.length > 0) {
        adolescenteData.familiares = familiaresNuevos.map((f) => ({
        nombre: f.nombre,
        apellido: f.apellido,
        telefono: f.telefono,
        id_vinculo: f.vinculo.id,
        }))
    }

    // ---- Familiares existentes que quedaron seleccionados (FamiliaresEditarCard) ----
    const idsFamiliaresExistentes = solicitud.adolescente.familiares
        .filter((f) => familiarSeleccionado.has(f.id))
        .map((f) => f.id)

    if (idsFamiliaresExistentes.length > 0) {
        adolescenteData.ids_familiares = idsFamiliaresExistentes
    }

    // ---- Referencias a instituciones ----
    // por ahora no se cargan nuevas, solo se validan todas las que ya estaban
    if (solicitud.adolescente.referencias_instituciones.length > 0) {
        adolescenteData.ids_referencias_instituciones = solicitud.adolescente.referencias_instituciones.map((r) => r.id)
    }

    // ---- Hermanos ----
    const hermanosValidados: any[] = []

    // existentes, confirmados contra RENAPER en HermanoCard
    solicitud.adolescente.hermanos.forEach((hermano, index) => {
        if (estadosHermanos[index] === "confirmado" && ciudadanosHermanos[index]) {
        const c = ciudadanosHermanos[index]!
        hermanosValidados.push({
            id_hermano: hermano.id,
            nombre: c.nombre,
            apellido: c.apellido,
            fecha_nacimiento: formatFecha(c.fechaNacimiento),
            sexo: c.sexo,
            dni: c.nroDocumento,
        })
        }
    })

    // nuevos, cargados con AgregarHermano (ya validados contra RENAPER ahí adentro)
    hermanosNuevos.forEach((h) => {
        hermanosValidados.push({
        nombre: h.nombre,
        apellido: h.apellido,
        fecha_nacimiento: formatFecha(h.fecha_nacimiento),
        sexo: h.sexo,
        dni: h.dni,
        })
    })

    if (hermanosValidados.length > 0) {
        adolescenteData.hermanos_validados = hermanosValidados
    }

    // ---- Armado del FormData ----
    const formData = new FormData()
    formData.append("descripcion_extra", nuevaDescripcion ?? "")
    formData.append("id_prioridad", String(nuevaPrioridad.id))
    formData.append("id_derivacion", String(idDerivacion))
    formData.append("adolescente", JSON.stringify(adolescenteData))

    // archivos existentes que quedaron seleccionados -> se validan (valido=true)
    archivoSeleccionado.forEach((id) => {
        formData.append("id_archivos", String(id))
    })

    // archivos nuevos subidos por el usuario
    archivosNuevos.forEach(({ file }) => {
        formData.append("archivos", file)
    })

    await validarSolicitud({
    solicitudId: solicitud.id,
    descripcionExtra: nuevaDescripcion,
    idPrioridad: nuevaPrioridad.id,
    idDerivacion: idDerivacion,
    adolescenteData,
    archivoSeleccionado,
    archivosNuevos,
    })
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
            nuevoDomicilio={nuevoDomicilio}
            setNuevoDomicilio={setNuevoDomicilio}
        />
        <FamiliaresEditarCard familiares={solicitud.adolescente.familiares} seleccionados={familiarSeleccionado} setSeleccionados={setFamiliarSeleccionado}/>
        <FamiliaresNuevos familiares={familiaresNuevos} setFamiliares={setFamiliaresNuevos} />
        <HermanoCard 
            hermanos={solicitud.adolescente.hermanos}
            estados={estadosHermanos}
            setEstados={setEstadosHermanos}
            ciudadanos={ciudadanosHermanos}
            setCiudadanos={setCiudadanosHermanos}
            nuevosHermanos={hermanosNuevos}
            setNuevosHermanos={setHermanosNuevos}
        />
        <SolicitudCard descripcion={solicitud.descripcion}/>
        
        <TextField
            label="Agregar más información"
            value={nuevaDescripcion}
            onChange={(e) => setNuevaDescripcion(e.target.value.slice(0, MAX_DESCRIPCION))}
            multiline
            minRows={3}
            fullWidth
            helperText={`${nuevaDescripcion.length}/${MAX_DESCRIPCION}`}
          />

        <ArchivoCard
        archivos={solicitud.archivos}
        seleccionados={archivoSeleccionado}
        setSeleccionados={setArchivoSeleccionado}
        onUpload={(file) => {
            setArchivosNuevos((prev) => [...prev, { id: crypto.randomUUID(), file }])
        }}
        />

        <ArchivoNuevoCard
        archivos={archivosNuevos}
        setArchivos={setArchivosNuevos}
        />            
        {solicitud.adolescente.referencias_instituciones.length > 0  &&
                <InstitucionesCard instituciones={solicitud.adolescente.referencias_instituciones}/>
            }
        <PrioridadSelector prioridad={nuevaPrioridad} setPrioridad={setNuevaPrioridad} />
        <AceptarButtons disabledConfirmar={disabledConfirmar} disabledRechazar={disabledRechazar} onConfirmar={aceptar} onRechazar={rechazar} />

    </>)
}
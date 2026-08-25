import type { Familiar, PersonaCreate } from "../../types"

import {
    Card,
    CardContent,
    Divider,
    Stack,
    Typography,
} from "@mui/material"

import type { Setter } from "@/common/types"

import { ValidarFamiliarDatos } from "./ValidarFamiliarDatos"
import { NuevasPersonas } from "./NuevasPersonas"

import { TelefonoOpcionalForm } from "../TelefonoOpcionalForm"
import { DomicilioOpcionalForm } from "@/features/domicilio/components/DomicilioOpcionalForm"

import type {
    Departamento,
    Provincia,
} from "@/features/domicilio/types"

import { useState } from "react"

type Props = {
    familiares: Familiar[]

    estados: ("confirmado" | "rechazado" | null)[]
    setEstados: Setter<("confirmado" | "rechazado" | null)[]>

    personas: (PersonaCreate | null)[]
    setPersonas: Setter<(PersonaCreate | null)[]>

    nuevosFamiliares: PersonaCreate[]
    setNuevosFamiliares: Setter<PersonaCreate[]>
}

export const ValidarFamiliares = ({
    familiares,
    estados,
    setEstados,
    personas,
    setPersonas,
    nuevosFamiliares,
    setNuevosFamiliares,
}: Props) => {

    const [telefonos, setTelefonos] = useState<string[]>(familiares.map((familiar) => familiar.telefono ?? ""))

    const [provincias, setProvincias] = useState<(Provincia | null)[]>(familiares.map(() => null))

    const [departamentos, setDepartamentos] = useState<(Departamento | null)[]>(familiares.map(() => null))

    const [domicilios, setDomicilios] = useState<string[]>(familiares.map((familiar) => familiar.domicilio?.nombre ?? ""))

    const [camposVisibles, setCamposVisibles] = useState<
        { telefono: boolean; domicilio: boolean }[]
    >(
        familiares.map((familiar) => ({
            telefono: !!familiar.telefono,
            domicilio: !!familiar.domicilio,
        }))
    )

    const cambiarCampo = (
        index: number,
        campo: "telefono" | "domicilio",
        valor: boolean
    ) => {
        setCamposVisibles((prev) => {
            const next = [...prev]
            next[index] = {
                ...next[index],
                [campo]: valor,
            }
            return next
        })
    }

    const actualizarPersona = (
        index: number,
        cambios: Partial<PersonaCreate>
    ) => {
        setPersonas((prev) => {
            const next = [...prev]

            if (!next[index]) {
                return next
            }

            next[index] = {
                ...next[index]!,
                ...cambios,
            }

            return next
        })
    }

    return (
        <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
            <CardContent>

                <Stack
                    direction="row"
                    sx={{
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 2,
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{ lineHeight: 1.2 }}
                    >
                        Familiares / referentes
                    </Typography>
                </Stack>

                <Stack spacing={3}>

                    {familiares.map((familiar, index) => {

                        const persona = personas[index]
                        const confirmado =
                            estados[index] === "confirmado"

                        return (
                            <Stack
                                spacing={2}
                                key={familiar.dni ?? index}
                            >

                                <ValidarFamiliarDatos
                                    familiar={familiar}
                                    estado={estados[index]}
                                    setEstado={(estado) => {
                                        setEstados((prev) => {
                                            const next = [...prev]
                                            next[index] = estado
                                            return next
                                        })
                                    }}
                                    setPersona={(nuevaPersona) => {
                                        setPersonas((prev) => {
                                            const next = [...prev]
                                            next[index] = nuevaPersona
                                            return next
                                        })
                                    }}
                                />

                                {confirmado && persona && (
                                    <>
                                        <TelefonoOpcionalForm
                                            condicion={
                                                camposVisibles[index].telefono
                                            }
                                            telefono={
                                                telefonos[index]
                                            }
                                            setTelefono={(valor) => {
                                                setTelefonos((prev) => {
                                                    const next = [...prev]
                                                    next[index] = valor
                                                    return next
                                                })

                                                actualizarPersona(index, {
                                                    telefono:
                                                        valor === ""
                                                            ? null
                                                            : valor,
                                                })
                                            }}
                                            mostrar={(valor) =>
                                                cambiarCampo(
                                                    index,
                                                    "telefono",
                                                    valor
                                                )
                                            }
                                        />

                                        <DomicilioOpcionalForm
                                            condicion={
                                                camposVisibles[index].domicilio
                                            }
                                            domicilio={
                                                domicilios[index]
                                            }
                                            setDomicilio={(valor) => {
                                                setDomicilios((prev) => {
                                                    const next = [...prev]
                                                    next[index] = valor
                                                    return next
                                                })

                                                actualizarPersona(index, {
                                                    domicilio:
                                                        valor === ""
                                                            ? null
                                                            : {
                                                                nombre: valor,
                                                                provincia:
                                                                    provincias[index],
                                                                departamento:
                                                                    departamentos[index],
                                                            } as any,
                                                })
                                            }}
                                            provincia={
                                                provincias[index]
                                            }
                                            setProvincia={(valor) => {
                                                setProvincias((prev) => {
                                                    const next = [...prev]
                                                    next[index] = valor
                                                    return next
                                                })

                                                actualizarPersona(index, {
                                                    domicilio: persona.domicilio
                                                        ? {
                                                            ...persona.domicilio,
                                                            provincia: valor,
                                                        }
                                                        : null,
                                                })
                                            }}
                                            departamento={
                                                departamentos[index]
                                            }
                                            setDepartamento={(valor) => {
                                                setDepartamentos((prev) => {
                                                    const next = [...prev]
                                                    next[index] = valor
                                                    return next
                                                })

                                                actualizarPersona(index, {
                                                    domicilio: persona.domicilio
                                                        ? {
                                                            ...persona.domicilio,
                                                            departamento: valor,
                                                        }
                                                        : null,
                                                })
                                            }}
                                            mostrar={(valor) =>
                                                cambiarCampo(
                                                    index,
                                                    "domicilio",
                                                    valor
                                                )
                                            }
                                        />
                                    </>
                                )}

                            </Stack>
                        )
                    })}

                </Stack>

                <Divider
                    variant="middle"
                    sx={{ my: 3 }}
                />

                <NuevasPersonas
                    nuevasPersonas={nuevosFamiliares}
                    setNuevasPersonas={setNuevosFamiliares}
                    datos_extra={true}
                />

            </CardContent>
        </Card>
    )
}
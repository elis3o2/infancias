import { Stack, Box, Button } from "@mui/material"
import type { Setter } from "@/common/types"
import type { PersonaCreate } from "../../types"

import { PersonaList } from "./PersonaList"
import { NuevaPersona } from "./NuevaPersona"
import { LegajoForm } from "../Validar/LegajoForm"

type Props = {
    nuevasPersonas: PersonaCreate[]
    setNuevasPersonas: Setter<PersonaCreate[]>
    datos_extra: boolean
}

export const NuevasPersonas = ({ nuevasPersonas, setNuevasPersonas, datos_extra }: Props) => {

    const actualizarLegajo = (index: number, cambios: Partial<NonNullable<PersonaCreate["legajo"]>>) => {
        setNuevasPersonas((prev) => {
            const next = [...prev]
            const persona = next[index]

            if (!persona) {
                return next
            }

            next[index] = {
                ...persona,
                legajo: {
                    id_insert: persona.legajo?.id_insert ?? null,
                    carpeta_id: persona.legajo?.carpeta_id ?? null,
                    ...cambios,
                },
            }

            return next
        })
    }

    const cambiarTieneLegajo = (index: number, valor: boolean) => {
        if (valor) {
            actualizarLegajo(index, {})
            return
        }

        setNuevasPersonas((prev) => {
            const next = [...prev]
            const persona = next[index]

            if (!persona) {
                return next
            }

            next[index] = {
                ...persona,
                legajo: null,
            }

            return next
        })
    }

    return (
        <Stack spacing={3}>

            {nuevasPersonas.map((persona, index) => (
                <Stack
                    direction="row"
                    spacing={2}
                    key={index}
                >
                    <Box sx={{ flex: 1 }}>

                        <PersonaList
                            persona={persona}
                        />

                        {!datos_extra && (
                            <LegajoForm
                                legajo={persona.legajo?.id_insert ?? null}
                                setLegajo={(valor) =>
                                    actualizarLegajo(index, {
                                        id_insert: valor,
                                    })
                                }
                                carpeta={persona.legajo?.carpeta_id ?? null}
                                setCarpeta={(valor) =>
                                    actualizarLegajo(index, {
                                        carpeta_id: valor,
                                    })
                                }
                                tieneLegajo={persona.legajo !== null}
                                setTieneLegajo={(valor) =>
                                    cambiarTieneLegajo(index, valor)
                                }
                            />
                        )}

                        <Button
                            onClick={() =>
                                setNuevasPersonas(
                                    nuevasPersonas.filter(
                                        (_, i) => i !== index
                                    )
                                )
                            }
                            variant="contained"
                            color="error"
                            sx={{ mt: 2 }}
                        >
                            Eliminar
                        </Button>

                    </Box>
                </Stack>
            ))}

            <NuevaPersona
                personas={nuevasPersonas}
                setPersonas={setNuevasPersonas}
                datos_extra={datos_extra}
            />

        </Stack>
    )
}

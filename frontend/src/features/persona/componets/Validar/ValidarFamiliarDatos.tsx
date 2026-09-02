import type { Familiar, Ciudadano, PersonaCreate } from "../../types"

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Collapse,
    Divider,
    Stack,
    Typography,
} from "@mui/material"

import FactCheckIcon from "@mui/icons-material/FactCheck"
import { getCiudadano } from "../../api"
import { useEffect, useState } from "react"
import { ValidarButtons } from "../Validacion/ValidarButtons"
import type { Setter } from "@/common/types"
import { FamiliarList } from "../Familiar/FamiliarList"
import { CiudadanoList } from "./CiudadanoList"
import { ciudadanoToPersona } from "../../utils"

type Props = {
    familiar: Familiar
    estado: "confirmado" | "rechazado" | null
    setEstado: Setter<"confirmado" | "rechazado" | null>
    setPersona: Setter<PersonaCreate | null>
}

export const ValidarFamiliarDatos = ({ familiar, estado, setEstado, setPersona }: Props) => {

    const [ciudadano, setCiudadano] = useState<Ciudadano | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleValidar = async () => {
        if (!familiar.dni) return

        setLoading(true)
        setError(null)

        try {
            const ciudadanoRes = await getCiudadano(
                familiar.dni,
                familiar.sexo
            )

            setCiudadano(ciudadanoRes)
        } catch (e) {
            setError("No se encontro a la persona.")
            setEstado("rechazado")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (estado !== "confirmado" || !ciudadano) {
            setPersona(null)
            return
        }

        const nuevaPersona = {
            ...ciudadanoToPersona(ciudadano),
            id_familiar: familiar.id,
            id_vinculo: familiar.vinculo.id
        }

        setPersona(nuevaPersona)

    }, [estado, ciudadano])

    return (
        <Stack direction="row" spacing={2}>

            <Box sx={{ flex: 1 }}>

                <Typography
                    variant="subtitle1"
                    sx={{ mb: 1, fontWeight: 600 }}
                >
                    Datos del Familiar
                </Typography>

                <FamiliarList
                    familiar={familiar}
                />

                {familiar.dni && (
                    <Button
                        onClick={handleValidar}
                        disabled={loading}
                        variant="contained"
                        startIcon={
                            loading ? (
                                <CircularProgress
                                    size={16}
                                    color="inherit"
                                />
                            ) : (
                                <FactCheckIcon />
                            )
                        }
                        sx={{
                            mt: 3,
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                        }}
                    >
                        {loading ? "Validando..." : "VALIDAR"}
                    </Button>
                )}

                {error && (
                    <Alert
                        severity="error"
                        sx={{ mt: 2, borderRadius: 2 }}
                    >
                        {error}
                    </Alert>
                )}

            </Box>

            {ciudadano && (
                <Divider
                    orientation="vertical"
                    flexItem
                />
            )}

            <Collapse
                in={Boolean(ciudadano)}
                orientation="horizontal"
                sx={{
                    flex: ciudadano ? 1 : 0,
                }}
            >
                {ciudadano && (
                    <Box>

                        <Typography
                            variant="subtitle1"
                            sx={{
                                mb: 1.5,
                                fontWeight: 600,
                            }}
                        >
                            Validación con RENAPER
                        </Typography>

                        <CiudadanoList
                            ciudadano={ciudadano}
                        />

                        {ciudadano.fallecido === "SI" && (
                            <Alert
                                severity="warning"
                                sx={{
                                    mt: 2,
                                    borderRadius: 2,
                                }}
                            >
                                La persona esta fallecida.
                            </Alert>
                        )}

                        <ValidarButtons
                            estado={estado}
                            setEstado={setEstado}
                        />

                    </Box>
                )}
            </Collapse>

        </Stack>
    )
}
import type { Hermano, Ciudadano, PersonaCreate } from "../../types"
import { Alert, Box, Button, CircularProgress, Collapse, Divider, Stack, Typography } from "@mui/material"
import FactCheckIcon from "@mui/icons-material/FactCheck"
import { getCiudadano } from "../../api"
import { useEffect, useState } from "react"
import { ValidarButtons } from "../Validacion/ValidarButtons"
import type { Setter } from "@/common/types"
import { HermanoList } from "../Hermano/HermanoList"
import { CiudadanoList } from "./CiudadanoList"
import { ciudadanoToPersona } from "../../utils"

type Props = {
    hermano: Hermano
    estado: "confirmado" | "rechazado" | null
    setEstado: (estado: "confirmado" | "rechazado" | null) => void
    setPersona: Setter<PersonaCreate | null>
}

export const ValidarHermanosDatos = ({hermano, estado, setEstado, setPersona }: Props) => {

    const [ciudadano, setCiudadano] = useState<Ciudadano | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleValidar = async () => {
        setLoading(true)
        setError(null)

        try {
            const ciudadanoRes = await getCiudadano(hermano.dni, hermano.sexo)
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
            id_hermano: hermano.id,
        }
        setPersona(nuevaPersona)
    
    }, [estado, ciudadano])

    return (
        <Stack
            direction="row"
            spacing={2}
        >
            <Box sx={{ flex: 1 }}>
                <Stack
                    direction="row"
                    sx={{
                        mb: 1,
                        alignItems: "center",
                    }}
                >
                    <Typography
                        variant="subtitle1"
                        sx={{ flexGrow: 1 }}
                    >
                        Datos del hermano
                    </Typography>
                </Stack>
                <HermanoList
                    hermano={hermano}
                />
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

                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mt: 2,
                            borderRadius: 2,
                        }}
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
                        <ValidarButtons estado={estado} setEstado={setEstado}/>
                    </Box>
                )}
            </Collapse>
        </Stack>
    )
}
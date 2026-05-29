import {
    Typography,
    Stack,
    TextField,
    Button,
    Box,
} from "@mui/material";
import type { Setter } from "../../../common/types";


type Props = {
    nuevaDireccion: string
    setNuevaDireccion: Setter<string>
}

export const NuevaDireccion = ({nuevaDireccion, setNuevaDireccion}: Props) => {
    return (<Box>
            <Typography
                variant="subtitle2"
                fontWeight={600}
                color="text.primary"
                sx={{ mb: 1.5 }}
            >
                Nueva dirección
            </Typography>

            <Stack spacing={2}>
                <TextField
                    label="Dirección"
                    placeholder="Ej: Av. Pellegrini 1234"
                    value={nuevaDireccion}
                    onChange={(e) => setNuevaDireccion(e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                    autoFocus
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            color: "text.primary",
                            background: "#ffffff",
                            "& fieldset": { borderColor: "#bae6fd" },
                            "&:hover fieldset": {
                                borderColor: "#7dd3fc",
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: "primary.main",
                            },
                        },
                        "& .MuiInputLabel-root": {
                            color: "text.secondary",
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                            color: "primary.main",
                        },
                    }}
                />

                <Stack
                    direction="row"
                    spacing={1.5}
                    justifyContent="flex-end"
                >
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                            setMostrarFormDireccion(false)
                        }
                        sx={{
                            textTransform: "none",
                            borderColor: "#cbd5e1",
                            color: "text.secondary",
                            borderRadius: 2,
                            "&:hover": {
                                borderColor: "#94a3b8",
                            },
                        }}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        size="small"
                        onClick={() =>
                            handleBuscar(nuevaDireccion)
                        }
                        disabled={nuevaDireccion.trim() === ""}
                        sx={{
                            textTransform: "none",
                            borderRadius: 2,
                            fontWeight: 600,
                        }}
                    >
                        Buscar
                    </Button>
                </Stack>
        </Box>
    )
}
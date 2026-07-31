import { Stack, TextField, Button, Box} from "@mui/material";
import type { Setter } from "@/common/types";
import { useState } from "react";

type Props = {
    direccion: string
    setDireccion: Setter<string>
    setFinishDireccion: Setter<boolean>
}

export const DireccionForm = ({direccion, setDireccion, setFinishDireccion}: Props) => {
    const [escribiendo, setEscribiendo] = useState(direccion)

    function  handleBuscar() {
        setDireccion(escribiendo)
        setFinishDireccion(true)
    } 

    return (<Box>

        <Stack spacing={2}>
            <TextField
                label="Dirección"
                placeholder="Ej: Av. Pellegrini 1234"
                value={escribiendo}
                onChange={(e) => setEscribiendo(e.target.value)}
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
                    variant="contained"
                    size="small"
                    onClick={() => {handleBuscar()}}
                    disabled={escribiendo.trim() === ""}
                    sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        fontWeight: 600,
                    }}
                >
                    Buscar
                </Button>
            </Stack>
        </Stack>
    </Box>
    )
}
import {Stack, Button, CircularProgress} from '@mui/material'
import type { Ciudadano } from '@/features/persona/types'
import SearchIcon from "@mui/icons-material/Search";

type Props = {
    loading: boolean;
    ciudadano: Ciudadano;
    error: string;
    handleBuscar: () => void;
    handleLimpiar: () => void;
    canSearch: boolean;
}

export const PersonaButtons = ({loading, ciudadano, error, handleBuscar, handleLimpiar, canSearch}: Props) => {
    
    return (
        <Stack direction="row" spacing={2}>
            <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={
                loading ? (
                    <CircularProgress size={18} color="inherit" />
                ) : (
                    <SearchIcon />
                )
                }
                onClick={handleBuscar}
                disabled={!canSearch}
                sx={{
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                py: 1.5,
                boxShadow: canSearch
                    ? "0 0 20px rgba(59,130,246,0.3)"
                    : "none",
                }}
            >
                {loading ? "Buscando…" : "Buscar"}
            </Button>

            {(ciudadano || error) && (
                <Button
                variant="outlined"
                size="large"
                onClick={handleLimpiar}
                sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    py: 1.5,
                    borderColor: "#cbd5e1",
                    color: "text.secondary",
                    "&:hover": { borderColor: "#94a3b8" },
                }}
                >
                Limpiar
                </Button>
            )}
        </Stack>
    )
}
import {Stack, Button } from '@mui/material'
import CheckIcon from "@mui/icons-material/Check";


type Props = {
    canConfirm: boolean
    onConfirmar: () => void
    onLimpiar: () => void
}

export const DireccionConfirmarButtons = ({canConfirm, onConfirmar, onLimpiar } : Props) => {
    return (
         <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<CheckIcon />}
              onClick={onConfirmar}
              color="success"
              disabled={!canConfirm}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                py: 1.25,
              }}
            >
              Confirmar
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={onLimpiar}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                py: 1.25,
                borderColor: "primary.main",
                color:"primary.main",
                "&:hover": { borderColor: "primary.main", color: "primary.main" },
              }}
            >
              Limpiar
            </Button>
        </Stack>)
}

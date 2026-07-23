import {Stack, Button } from '@mui/material'
import CheckIcon from "@mui/icons-material/Check";
import type { Setter } from '@/common/types';

type Props = {
    canConfirm: boolean
    setFinishDomicilio: Setter<boolean>
    setFinishDireccion: Setter<boolean>
}


export const DireccionConfirmarButtons = ({canConfirm, setFinishDomicilio, setFinishDireccion } : Props) => {
    return (
         <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<CheckIcon />}
              onClick={() => setFinishDomicilio(true)}
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
              onClick={() => {setFinishDireccion(false)}}
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
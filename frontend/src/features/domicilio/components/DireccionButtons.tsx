import {Stack, Button } from '@mui/material'
import CheckIcon from "@mui/icons-material/Check";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import type { Setter } from '@/common/types';

type Props = {
    setValidarDireccion: Setter<boolean>
    setFinishDireccion: Setter<boolean>
}


export const DireccionButtons = ({setValidarDireccion, setFinishDireccion} : Props) => {
    return (
         <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<CheckIcon />}
              onClick={() => setValidarDireccion(true)}
              color="success"
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                py: 1.25,
              }}
            >
              Validar Dirección
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<EditLocationAltIcon />}
              onClick={() => setFinishDireccion(false)}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                py: 1.25,
                borderColor:  "primary.main",
                color: "primary.main",
                "&:hover": { borderColor: "primary.main", color: "primary.main" },
              }}
            >
              Cambiar Dirección
            </Button>
        </Stack>)
}
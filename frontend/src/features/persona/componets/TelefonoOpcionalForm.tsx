import { Stack, Box, Button, IconButton } from "@mui/material"
import CloseIcon from "@mui/icons-material/Close";
import { TelefonoComponent } from "./TelefonoComponent";
import type { Setter } from "@/common/types";

type Props = {
    condicion: boolean
    telefono: string 
    setTelefono: Setter<string>
    mostrar: (b: boolean) => void
}

export const TelefonoOpcionalForm = ({condicion, telefono, setTelefono, mostrar}: Props) => {

    if (condicion) {
    return  (
          <Box>
            <Stack direction="row" sx={{ alignItems:"center" }} spacing={1}>
              <Box sx = {{flex: 1}}>
                <TelefonoComponent telefono={telefono} setTelefono={setTelefono}/>
              </Box>
              <IconButton
                size="small"
                onClick={() => mostrar(false)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        )
     }
    else { 
        return (
          <Button
            size="small"
            variant="outlined"
            onClick={() => mostrar(true)}
            sx={{ alignSelf: "flex-start" }}
          >
            + Cargar teléfono
          </Button>
        )
    }
}
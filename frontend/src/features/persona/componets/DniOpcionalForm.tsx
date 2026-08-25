import { Stack, Box, Button, IconButton } from "@mui/material"
import CloseIcon from "@mui/icons-material/Close";
import { DniForm } from "./DniForm"
import type { Setter } from "@/common/types";

type Props = {
    condicion: boolean
    dni: string 
    setDni: Setter<string>
    mostrar: (b: boolean) => void
}

export const DniOpcionalForm = ({ condicion, dni, setDni, mostrar }: Props) => {
    if (condicion){ 
        return( 
            <Box>
                <Stack direction="row" sx={{ alignItems :"center"}} spacing={1}>
                <Box sx= {{flex: 1}}>
                    <DniForm
                    dni={dni}
                    setDni={setDni}
                    />
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
        return  (
          <Button
            size="small"
            variant="outlined"
            onClick={() => mostrar(true)}
            sx={{ alignSelf: "flex-start" }}
          >
            + Cargar DNI
          </Button>
        )
    }
}
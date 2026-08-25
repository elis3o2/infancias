import { Stack, Box, Button, IconButton, TextField } from "@mui/material"
import CloseIcon from "@mui/icons-material/Close";
import { ProvinciaComponent } from "./ProvinciaComponent";
import { DepartamentoComponent } from "./DepartamentoComponet";
import type { Setter } from "@/common/types";
import type { Departamento, Provincia } from "../types";

type Props = {
    condicion: boolean
    domicilio: string 
    setDomicilio: Setter<string>
    provincia: Provincia | null 
    setProvincia: Setter<Provincia | null>
    departamento: Departamento | null 
    setDepartamento: Setter<Departamento | null>
    mostrar: (b: boolean) => void
}


export const DomicilioOpcionalForm = ({condicion, domicilio, setDomicilio, 
                            provincia, setProvincia, departamento, setDepartamento, mostrar}: Props) => {
    if (condicion) {
        return (
        <Stack spacing={1}>
            <Stack direction="row" spacing={1}>
              <Box sx={{ flex: 1 }}>
                <ProvinciaComponent provincia={provincia} setProvincia={setProvincia}/>
              </Box>
              <Box sx={{ flex: 1 }}>
                <DepartamentoComponent
                  departamento={departamento}
                  setDepartamento={setDepartamento}
                  id_provincia={provincia == null ? null : provincia.id}
                />
              </Box>
            </Stack>

            <Stack direction="row" sx={{ alignItems: "center" }} spacing={1}>
              <TextField
                fullWidth
                label="Domicilio"
                value={domicilio}
                onChange={(e) => setDomicilio(e.target.value)}
              />
              <IconButton
                size="small"
                onClick={() => mostrar(false)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
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
            + Cargar domicilio
          </Button>
        )
    }
}
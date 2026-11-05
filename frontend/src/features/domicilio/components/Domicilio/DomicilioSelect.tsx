import { Stack, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material"
import type { DomicilioFormData } from "../../types"
import CheckIcon from "@mui/icons-material/Check";
import type { Setter } from "@/common/types";


type Props = {
    domicilios: DomicilioFormData[]
    indiceElegido: string
    setIndiceElegido: Setter<string>
    onConfirmar: () => void
    onCargarOtro: () => void
}


export const DomicilioSelect = ({ domicilios, indiceElegido, setIndiceElegido, onConfirmar, onCargarOtro }: Props) => {
    

    return (
    <Stack spacing={1.5}>
        <FormControl fullWidth size="small">
            <InputLabel>
                Domicilio
            </InputLabel>
            <Select
                value={indiceElegido}
                label="Domicilio"
                onChange={(event) => setIndiceElegido(event.target.value)}
            >
                {domicilios.map((domicilio, indice) => (
                    <MenuItem
                        key={indice}
                        value={String(indice)}
                    >
                        {domicilio.nombre}
                        {domicilios.filter((item) => item.nombre === domicilio.nombre).length > 1
                            ? ` · Departamento ${domicilio.id_departamento ?? "sin indicar"}${domicilio.observaciones ? ` · ${domicilio.observaciones}` : ""}` : ""}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
            <Button
                size="small"
                variant="text"
                onClick={onCargarOtro}
                sx={{ textTransform: "none" }}
            >
                Cargar otro domicilio
            </Button>
            <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckIcon fontSize="small" />}
                onClick={onConfirmar}
                disabled={indiceElegido === "" || !domicilios[Number(indiceElegido)]}
                sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.4,
                    fontSize: "0.8rem",
                }}
            >
                Confirmar
            </Button>
        </Stack>
    </Stack>
    )
}

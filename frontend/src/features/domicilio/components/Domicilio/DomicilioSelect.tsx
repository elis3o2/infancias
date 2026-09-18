import { Stack, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material"
import type { DomicilioFormData } from "../../types"
import CheckIcon from "@mui/icons-material/Check";
import type { Setter } from "@/common/types";


type Props = {
    domicilios: DomicilioFormData[]
    nombreElegido: string
    setNombreElegido: Setter<string>
    onConfirmar: () => void
    onCargarOtro: () => void
}


export const DomicilioSelect = ({ domicilios, nombreElegido, setNombreElegido, onConfirmar, onCargarOtro }: Props) => {
    

    return (
    <Stack spacing={1.5}>
        <FormControl fullWidth size="small">
            <InputLabel>
                Domicilio
            </InputLabel>
            <Select
                value={nombreElegido}
                label="Domicilio"
                onChange={(event) => setNombreElegido(event.target.value)}
            >
                {domicilios.map((domicilio) => (
                    <MenuItem
                        key={domicilio.nombre}
                        value={domicilio.nombre}
                    >
                        {domicilio.nombre}
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
                disabled={!nombreElegido}
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
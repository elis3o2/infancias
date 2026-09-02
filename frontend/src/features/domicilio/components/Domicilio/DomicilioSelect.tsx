import { useState } from "react"
import { Stack, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material"
import type { DomicilioFormData } from "../../types"


type Props = {
    domicilios: DomicilioFormData[]
    domicilio: DomicilioFormData | null
    onCargarOtro: () => void
}


export const DomicilioSelect = ({ domicilios, domicilio, onCargarOtro }: Props) => {
    
    const [nombreElegido, setNombreElegido] = useState(domicilio?.nombre ?? "");

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
        </Stack>
    </Stack>
    )
}
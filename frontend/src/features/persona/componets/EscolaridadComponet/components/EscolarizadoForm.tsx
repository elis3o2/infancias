import type { Setter } from '@/common/types'
import {FormControl, FormLabel, RadioGroup, FormControlLabel, Radio} from '@mui/material'

type Props = {
    escolarizado: boolean
    setEscolarizado: Setter<boolean>
}

export const EscolarizadoForm = ({escolarizado, setEscolarizado}: Props) => {
    return (
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1 }}>
            ¿Se encuentra actualmente escolarizado/a?
        </FormLabel>
        <RadioGroup
            row
            name="escolarizado"
            value={escolarizado}
            onChange={(e) => setEscolarizado(e.target.value === "true")}
        >
            <FormControlLabel value="true" control={<Radio />} label="Sí" />
            <FormControlLabel value="false" control={<Radio />} label="No" />
        </RadioGroup>
        </FormControl>
    )
}
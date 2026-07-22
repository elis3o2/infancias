import type { Setter } from '@/common/types'
import {Box, TextField, FormHelperText} from '@mui/material'

type Props = {
    escuela: string 
    setEscuela: Setter<string>
}

export const EscuelaForm = ({escuela, setEscuela}: Props) => {
    return (
    <Box>
        <TextField
          fullWidth
          label="Escuela a la que asistió"
          placeholder="Nombre de la institución educativa"
          value={escuela}
          onChange={(e)=> setEscuela(e.target.value) }
        />
        <FormHelperText>
          Escriba el nombre completo del establecimiento.
        </FormHelperText>
    </Box>
    )
}
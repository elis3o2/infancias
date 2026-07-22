import type { Setter } from '@/common/types'
import {TextField} from '@mui/material'

type Props = {
    dni: string
    setDni: Setter<string>
}

export const DniForm = ({dni, setDni}: Props) => {
    
    const dniInvalid = dni !== "" && dni !== null && !/^\d{7,8}$/.test(dni);
    
    return (
        <TextField
            label="Número de Documento"
            placeholder="Ej: 12345678"
            value={dni ?? ""}
            onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                setDni(val);
            }}
            error={dniInvalid}
            helperText={
                dniInvalid ? "El DNI debe tener entre 7 y 8 dígitos" : ""
            }
            inputProps={{ inputMode: "numeric", maxLength: 8 }}
            fullWidth
            variant="outlined"
            sx={{
                "& .MuiOutlinedInput-root": {
                    color: "text.primary",
                    "& fieldset": { borderColor: "#cbd5e1" },
                    "&:hover fieldset": { borderColor: "#94a3b8" },
                    "&.Mui-focused fieldset": {
                        borderColor: "primary.main",
                    },
                },
                "& .MuiInputLabel-root": {
                    color: "text.secondary",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                    color: "primary.main",
                },
                "& .MuiFormHelperText-root": {
                    color: "error.main",
                },
            }}
        />
    )
}
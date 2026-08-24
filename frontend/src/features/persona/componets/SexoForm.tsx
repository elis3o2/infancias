import {FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Typography, FormHelperText} from '@mui/material'

type Props = {
    sexo: "M" | "F" | ""
    setSexo: (s : "M" | "F" | "") => void
}

export const SexoForm = ({sexo, setSexo}: Props) => {
    return (
        <FormControl>
        <FormLabel
            sx={{
                color: "text.secondary",
                fontSize: "0.875rem",
                mb: 1,
                "&.Mui-focused": {
                    color: "primary.main",
                },
            }}
        >
            Sexo
        </FormLabel>

        <RadioGroup
            row
            value={sexo}
            onChange={(e) =>
                setSexo(e.target.value as "M" | "F")
            }
        >
            {[
                { value: "M", label: "Masculino" },
                { value: "F", label: "Femenino" },
            ].map((opt) => (
                <FormControlLabel
                    key={opt.value}
                    value={opt.value}
                    control={
                        <Radio
                            sx={{
                                color: "#94a3b8",
                                "&.Mui-checked": {
                                    color: "primary.main",
                                },
                            }}
                        />
                    }
                    label={
                        <Typography
                            color={
                                sexo === opt.value
                                    ? "primary.main"
                                    : "text.secondary"
                            }
                        >
                            {opt.label}
                        </Typography>
                    }
                />
            ))}
        </RadioGroup>

        {sexo === "" && (
            <FormHelperText sx={{ color: "error.main" }}>
                Seleccione el sexo
            </FormHelperText>
        )}
    </FormControl>
    )
}
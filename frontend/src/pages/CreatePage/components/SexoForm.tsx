import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import type { Setter } from "../../../common/types";

type Props ={
    submitted: boolean
    sexo: "M" | "F" | ""
    setSexo: Setter<("M" | "F" | "")>
    isLocked: boolean
}


export const SexoForm = ({submitted, sexo, setSexo, isLocked} : Props) => { 
    return (
        <FormControl error={submitted && sexo === ""} disabled={isLocked}>
            <FormLabel
                sx={{
                color: "text.secondary",
                fontSize: "0.875rem",
                mb: 1,
                "&.Mui-focused": { color: "primary.main" },
                }}
            >
                Sexo
            </FormLabel>
            <RadioGroup
                row
                value={sexo}
                onChange={(e) => setSexo(e.target.value as "M" | "F")}
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
                        "&.Mui-checked": { color: "primary.main" },
                        }}
                    />
                    }
                    label={
                    <Typography
                        color={sexo === opt.value ? "primary.main" : "text.secondary"}
                    >
                        {opt.label}
                    </Typography>
                    }
                />
                ))}
            </RadioGroup>
            {submitted && sexo === "" && (
                <FormHelperText sx={{ color: "error.main" }}>
                Seleccione el sexo
                </FormHelperText>
            )}
            </FormControl>
        )
}
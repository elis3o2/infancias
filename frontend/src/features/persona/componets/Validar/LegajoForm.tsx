import {
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
} from "@mui/material"

type Props = {
    tieneLegajo: boolean
    setTieneLegajo: (valor: boolean) => void
    legajo: number | null
    letra: "A" | "B" | "C"
    setLegajo: (valor: number | null) => void
    setLetra: (valor: "A" | "B" | "C") => void
}

export const LegajoForm = ({
    tieneLegajo,
    setTieneLegajo,
    legajo,
    letra,
    setLegajo,
    setLetra,
}: Props) => {
    return (
        <Stack spacing={2}>
            <FormControlLabel
                control={
                    <Switch
                        checked={tieneLegajo}
                        onChange={(e) => {
                            const activo = e.target.checked
                            setTieneLegajo(activo)

                            if (!activo) {
                                setLegajo(null)
                            }
                        }}
                    />
                }
                label="¿Tiene legajo?"
            />

            {tieneLegajo && (
                <Stack direction="row" spacing={2}>
                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel id="letra-legajo-label">
                            Letra
                        </InputLabel>

                        <Select
                            labelId="letra-legajo-label"
                            value={letra}
                            label="Letra"
                            onChange={(e) =>
                                setLetra(e.target.value as "A" | "B")
                            }
                        >
                            <MenuItem value="A">A</MenuItem>
                            <MenuItem value="B">B</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="Número de legajo"
                        type="number"
                        value={legajo ?? ""}
                        onChange={(e) =>
                            setLegajo(
                                e.target.value === ""
                                    ? null
                                    : Number(e.target.value)
                            )
                        }
                        fullWidth
                    />
                </Stack>
            )}
        </Stack>
    )
}
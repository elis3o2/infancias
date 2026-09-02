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
    tieneCarpeta: boolean
    setTieneCarpeta: (valor: boolean) => void
    carpeta: number | null
    letra: "A" | "B"
    setCarpeta: (valor: number | null) => void
    setLetra: (valor: "A" | "B") => void
}

export const CarpetaForm = ({
    tieneCarpeta,
    setTieneCarpeta,
    carpeta,
    letra,
    setCarpeta,
    setLetra,
}: Props) => {
    return (
        <Stack spacing={2}>

            <FormControlLabel
                control={
                    <Switch
                        checked={tieneCarpeta}
                        onChange={(e) => {
                            const activo = e.target.checked
                            setTieneCarpeta(activo)

                            if (!activo) {
                                setCarpeta(null)
                            }
                        }}
                    />
                }
                label="¿Tiene carpeta?"
            />

            {tieneCarpeta && (
                <Stack direction="row" spacing={2}>
                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel id="letra-carpeta-label">
                            Letra
                        </InputLabel>

                        <Select
                            labelId="letra-carpeta-label"
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
                        label="Número de carpeta"
                        type="number"
                        value={carpeta ?? ""}
                        onChange={(e) =>
                            setCarpeta(
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
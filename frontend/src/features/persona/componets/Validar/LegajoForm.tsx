import { Stack, Switch, TextField, FormControlLabel } from "@mui/material"

type Props = {
    tieneLegajo: boolean
    setTieneLegajo: (valor: boolean) => void
    legajo: number | null
    setLegajo: (valor: number | null) => void
}

export const LegajoForm = ({tieneLegajo, setTieneLegajo, legajo, setLegajo }: Props) => {
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
            )}

        </Stack>
    )
}
import { Stack, Switch, TextField, FormControlLabel } from "@mui/material"

type Props = {
    tieneCarpeta: boolean
    setTieneCarpeta: (valor: boolean) => void
    carpeta: number | null
    setCarpeta: (valor: number | null) => void
}

export const CarpetaForm = ({tieneCarpeta, setTieneCarpeta, carpeta, setCarpeta }: Props) => {
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
            )}

        </Stack>
    )
}
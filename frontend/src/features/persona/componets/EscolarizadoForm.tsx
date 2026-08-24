import {
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    Stack,
} from "@mui/material"

type Props = {
    escolarizado: boolean | null
    setEscolarizado: (value: boolean | null) => void
}

export const EscolarizadoForm = ({escolarizado, setEscolarizado}: Props) => {

    const selectedValue =
        escolarizado === true
            ? "si"
            : escolarizado === false
                ? "no"
                : "no_se_sabe"

    const handleChange = (
        _: React.MouseEvent<HTMLElement>,
        newValue: string | null,
    ) => {
        if (newValue === null) {
            return
        }

        if (newValue === "si") {
            setEscolarizado(true)
        } else if (newValue === "no") {
            setEscolarizado(false)
        } else if (newValue === "no_se_sabe") {
            setEscolarizado(null)
        }
    }

    return (
        <Stack spacing={1}>

            <Typography variant="body2">
                ¿Está escolarizado?
            </Typography>

            <ToggleButtonGroup
                value={selectedValue}
                exclusive
                onChange={handleChange}
                size="small"
                sx={{
                    "& .MuiToggleButton-root.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "primary.contrastText",
                        "&:hover": {
                            backgroundColor: "primary.dark",
                        },
                    },
                }}
            >
                <ToggleButton value="si">
                    Sí
                </ToggleButton>

                <ToggleButton value="no">
                    No
                </ToggleButton>

                <ToggleButton value="no_se_sabe">
                    No se sabe
                </ToggleButton>
            </ToggleButtonGroup>

        </Stack>
    )
}
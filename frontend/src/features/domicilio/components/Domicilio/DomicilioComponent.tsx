import { useState } from "react";
import { Button, FormControl, InputLabel, MenuItem, Select, Stack } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import type { DomicilioFormData } from "../../types";
import { DomicilioCarga } from "./DomicilioCarga";
import { DomicilioView } from "./DomicilioView";


type Props = {
    domicilios: DomicilioFormData[]
    domicilio: DomicilioFormData | null
    onGuardar: (domicilio: DomicilioFormData) => void
    onLimpiar: () => void
}

export const DomicilioComponent = ({ domicilios, domicilio, onGuardar, onLimpiar }: Props) => {

    const [mostrarFormulario, setMostrarFormulario] = useState(domicilios.length === 0);
    const [nombreElegido, setNombreElegido] = useState(domicilio?.nombre ?? "");
    const [confirmado, setConfirmado] = useState(domicilio != null);

    const confirmarSeleccion = () => {
        const encontrado = domicilios.find((d) => d.nombre === nombreElegido)
        if (encontrado) {
            onGuardar(encontrado)
            setConfirmado(true)
        }
    }

    const editarSeleccion = () => {
        setConfirmado(false)
    }

    const cargarOtroDomicilio = () => {
        onLimpiar()
        setNombreElegido("")
        setConfirmado(false)
        setMostrarFormulario(true);
    };


    if (mostrarFormulario) {

        return (

            <Stack spacing={2}>

                <DomicilioCarga
                    domicilio={domicilio}
                    onGuardar={onGuardar}
                />

                {domicilios.length > 0 && (
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setMostrarFormulario(false)}
                        sx={{
                            alignSelf: "flex-start",
                            textTransform: "none",
                            borderRadius: 2,
                        }}
                    >
                        Seleccionar domicilio existente
                    </Button>
                )}
            </Stack>
        );

    }


    if (confirmado && domicilio != null) {

        return (
            <DomicilioView
                domicilio={domicilio.nombre}
                observaciones={domicilio.observaciones}
                onEditar={() => editarSeleccion()}
            />
        );
    }


    return (

        <Stack spacing={1.5}>
            <FormControl fullWidth size="small">
                <InputLabel>
                    Domicilio
                </InputLabel>
                <Select
                    value={nombreElegido}
                    label="Domicilio"
                    onChange={(event) => setNombreElegido(event.target.value)}
                >
                    {domicilios.map((domicilio) => (
                        <MenuItem
                            key={domicilio.nombre}
                            value={domicilio.nombre}
                        >
                            {domicilio.nombre}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                <Button
                    size="small"
                    variant="text"
                    onClick={cargarOtroDomicilio}
                    sx={{ textTransform: "none" }}
                >
                    Cargar otro domicilio
                </Button>
                <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon fontSize="small" />}
                    onClick={confirmarSeleccion}
                    disabled={!nombreElegido}
                    sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.4,
                        fontSize: "0.8rem",
                    }}
                >
                    Confirmar
                </Button>
            </Stack>
        </Stack>

    );

};
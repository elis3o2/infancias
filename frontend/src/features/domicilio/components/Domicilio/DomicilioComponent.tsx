import { useState } from "react";
import { Button, Stack } from "@mui/material";
import type { DomicilioFormData } from "../../types";
import { DomicilioCarga } from "./DomicilioCarga";
import { DomicilioView } from "./DomicilioView";
import { DomicilioSelect } from "./DomicilioSelect";


type Props = {
    domicilios: DomicilioFormData[]
    domicilio: DomicilioFormData | null
    onGuardar: (domicilio: DomicilioFormData) => void
    onLimpiar: () => void
}

export const DomicilioComponent = ({ domicilios, domicilio, onGuardar, onLimpiar }: Props) => {

    const [mostrarFormulario, setMostrarFormulario] = useState(
        domicilio === null && domicilios.length === 0
    );
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
        setMostrarFormulario(false)
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
        <DomicilioSelect
            domicilios={domicilios}
            nombreElegido={nombreElegido}
            setNombreElegido={setNombreElegido}
            onCargarOtro={cargarOtroDomicilio}
            onConfirmar={confirmarSeleccion}
        />
    );

};

import { useState } from "react"
import { Box, Divider, TextField } from "@mui/material"
import type { DomicilioFormData } from "@/features/domicilio/types"
import type { APIGeo1 } from "@/features/api_externa/types"
import { DireccionForm } from "./DireccionForm"
import { SelectDireccion } from "./SelectDireccion"
import { DireccionConfirmarButtons } from "./DireccionConfirmarButtons"


type Props = {
    onGuardar: (domicilio: DomicilioFormData) => void
}

export const DomicilioForm = ({ onGuardar }: Props) => {
    const [finishDireccion, setFinishDireccion] = useState(false)
    const [canConfirm, setCanConfirm] = useState(false)
    const [direccion, setDireccion] = useState("")
    const [observaciones, setObservaciones] = useState("")
    const [geoSeleccionada, setGeoSeleccionada] = useState<APIGeo1 | null>(null)

    const handleConfirmar = () => {
        if (!geoSeleccionada) return
        onGuardar({
            nombre: geoSeleccionada.name,
            domicilio_validado: geoSeleccionada,
            id_departamento: 520,
            observaciones,
        })
    }


    return (
        <Box>
            {!finishDireccion && (
                <DireccionForm
                    direccion={direccion}
                    setDireccion={setDireccion}
                    setFinishDireccion={setFinishDireccion}
                />
            )}

            {finishDireccion && direccion != null && (
                <>
                    <DireccionForm
                        direccion={direccion}
                        setDireccion={setDireccion}
                        setFinishDireccion={setFinishDireccion}
                    />

                    <SelectDireccion
                        direccion={direccion}
                        setCanConfirm={setCanConfirm}
                        setGeoSeleccionada={setGeoSeleccionada}
                    />
                </>
            )}

            <Divider
                sx={{
                    borderColor: "#e2e8f0",
                    my: 3,
                }}
            />

            <TextField
                label="Observaciones"
                placeholder="Ingrese observaciones sobre el domicilio"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                multiline
                minRows={2}
                maxRows={4}
                fullWidth
                size="small"
            />

            <Divider
                sx={{
                    borderColor: "#e2e8f0",
                    my: 3,
                }}
            />

            {finishDireccion &&
                direccion != null &&
                canConfirm  && (
                    <DireccionConfirmarButtons
                        canConfirm={canConfirm}
                        onConfirmar={handleConfirmar}
                        onLimpiar={() => setFinishDireccion(false)}
                    />
                )}

        </Box>
    )
}
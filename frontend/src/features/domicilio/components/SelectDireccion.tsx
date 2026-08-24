import { useState, useEffect } from "react";
import { Box, List, ListItemButton, ListItemText, Alert } from "@mui/material";
import type { APIGeo1 } from "@/features/domicilio/types";
import { getGeo } from "@/features/domicilio/api";
import type { Setter } from "@/common/types";
import { Mapa } from "./Mapa";


type Props = {
    direccion: string;
    setCanConfirm: Setter<boolean>
    setGeoSeleccionada: Setter<APIGeo1 | null>
};

export const SelectDireccion = ({ direccion, setCanConfirm, setGeoSeleccionada }: Props) => {
    const [resultados, setResultados] = useState<APIGeo1[]>([]);
    const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<APIGeo1 | null>(null);
    const [buscado, setBuscado] = useState(false);

    useEffect(() => {
        if (direccion === "") return;

        const fetchGeo = async () => {
            try {
                const data = await getGeo(direccion);
                setResultados(data);
                setBuscado(true);
            } catch (error) {
                setCanConfirm(false)
                console.log(error);
            }
        };

        fetchGeo();
    }, [direccion]);


    useEffect(() =>{
        if (!ubicacionSeleccionada){
            setCanConfirm(false)
            setGeoSeleccionada(null)
        }
        else{
            setCanConfirm(true);
            setGeoSeleccionada(ubicacionSeleccionada)
        }
    }, [ubicacionSeleccionada])


    return (
        <Box sx={{ mt: 3, p: 2.5, borderRadius: 2, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
            {resultados.length > 0 && (
                <List sx={{ background: "#fff", borderRadius: 2, border: "1px solid #cbd5e1", maxHeight: 250, overflow: "auto" }}>
                    {resultados.map((resultado, index) => {
                        console.log(resultado)
                        const seleccionado = ubicacionSeleccionada?.id === resultado.id;
                        return (
                            <ListItemButton
                                key={index}
                                selected={seleccionado}
                                onClick={() => setUbicacionSeleccionada(resultado)}
                                sx={{
                                    borderLeft: seleccionado ? "4px solid" : "4px solid transparent",
                                    borderColor: seleccionado ? "primary.main" : "transparent",
                                    backgroundColor: seleccionado ? "action.selected" : undefined,
                                }}
                            >
                                <ListItemText
                                    primary={resultado.name}
                                    secondary={seleccionado ? "Dirección seleccionada" : undefined}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>
            )}

            {ubicacionSeleccionada && (
                <Mapa
                    latitud={ubicacionSeleccionada.latitud}
                    longitud={ubicacionSeleccionada.longitud}
                    nombre={ubicacionSeleccionada.name}
                />
            )}
            {buscado && resultados.length === 0 && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                No se encontraron resultados para la dirección ingresada.
            </Alert>
            )}
        </Box>
    );
};
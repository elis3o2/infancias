import { useState } from "react";
import { useMap } from "react-leaflet";
import { useEffect } from "react";
import {
    Box,
    Typography,
    Stack,
    TextField,
    Button,
    List,
    ListItemButton,
    ListItemText,
} from "@mui/material";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import { NuevaDireccion } from "./NuevaDireccion";
import L from "leaflet";

import type { Setter } from "../../../common/types";
import { getGeo } from "../../../features/domicilio/api";
import type { Geolocalizacion } from "../../../features/domicilio/types";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


type Props = {
    mostrarFormDireccion: boolean;
    setMostrarFormDireccion: Setter<boolean>;
};

export const BuscarDireccion = ({mostrarFormDireccion, setMostrarFormDireccion}: Props) => {
    
    const [nuevaDireccion, setNuevaDireccion] = useState("");

    const [resultados, setResultados] = useState<Geolocalizacion[]>([]);

    const [ubicacionSeleccionada, setUbicacionSeleccionada] =
        useState<Geolocalizacion | null>(null);

    async function handleBuscar(direccion: string) {
        try {
            const data = await getGeo(direccion);

            setResultados(data);
        } catch (error) {
            console.log(error);
        }
    }
        type RecenterMapProps = {
        lat: number;
        lon: number;
    };

    function RecenterMap({ lat, lon }: RecenterMapProps) {
        const map = useMap();

        useEffect(() => {
            map.setView([lat, lon], 17, {
                animate: true,
            });
        }, [lat, lon, map]);

        return null;
    }

    return (
        <Box
            sx={{
                mt: 3,
                p: 2.5,
                borderRadius: 2,
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
            }}
        >
            <NuevaDireccion
                nuevaDireccion={nuevaDireccion}
                setNuevaDireccion={setNuevaDireccion}
            />
                {resultados.length > 0 && (
                    <List
                        sx={{
                            background: "#fff",
                            borderRadius: 2,
                            border: "1px solid #cbd5e1",
                            maxHeight: 250,
                            overflow: "auto",
                        }}
                    >
                        {resultados.map((resultado, index) => {
                            const seleccionado =
                                ubicacionSeleccionada?.properties.id ===
                                resultado.properties.id;

                            return (
                                <ListItemButton
                                    key={index}
                                    selected={seleccionado}
                                    onClick={() =>
                                        setUbicacionSeleccionada(resultado)
                                    }
                                    sx={{
                                        borderLeft: seleccionado
                                            ? "4px solid"
                                            : "4px solid transparent",
                                        borderColor: seleccionado
                                            ? "primary.main"
                                            : "transparent",
                                        backgroundColor: seleccionado
                                            ? "action.selected"
                                            : undefined,
                                    }}
                                >
                                    <ListItemText
                                        primary={resultado.properties.name}
                                        secondary={
                                            seleccionado
                                                ? "Dirección seleccionada"
                                                : undefined
                                        }
                                    />
                                </ListItemButton>
                            );
                        })}
                    </List>
                )}

                {ubicacionSeleccionada && (
                    <Box
                        sx={{
                            height: 400,
                            borderRadius: 2,
                            overflow: "hidden",
                        }}
                    >
                        <MapContainer
                            center={[
                                ubicacionSeleccionada.geometry.coordinates[0],
                                ubicacionSeleccionada.geometry.coordinates[1],
                            ]}
                            zoom={17}
                            style={{
                                height: "100%",
                                width: "100%",
                            }}
                        >
                            <TileLayer
                                attribution='&copy; OpenStreetMap contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <RecenterMap
                                lat={
                                    ubicacionSeleccionada.geometry.coordinates[0]
                                }
                                lon={
                                    ubicacionSeleccionada.geometry.coordinates[1]
                                }
                            />

                            <Marker
                                position={[
                                    ubicacionSeleccionada.geometry.coordinates[0],
                                    ubicacionSeleccionada.geometry.coordinates[1],
                                ]}
                            >
                                <Popup>
                                    <strong>
                                        {
                                            ubicacionSeleccionada.properties.name
                                        }
                                    </strong>
                                    <br />
                                    Dirección seleccionada
                                </Popup>
                            </Marker>
                        </MapContainer>                    
                    </Box>
                )}
            </Stack>
        </Box>
    );
};
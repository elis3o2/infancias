import { useState, useEffect } from "react";
import { useMap, MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Box, List, ListItemButton, ListItemText, Alert } from "@mui/material";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Geolocalizacion } from "@/features/domicilio/types";
import { getGeo } from "@/features/domicilio/api";
import type { Setter } from "@/common/types";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type RecenterMapProps = { lat: number; lon: number };

function RecenterMap({ lat, lon }: RecenterMapProps) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lon], 17, { animate: true });
    }, [lat, lon, map]);
    return null;
}

type Props = {
    direccion: string;
    setCanConfirm: Setter<boolean>
    setGeoSeleccionada: Setter<Geolocalizacion>
};

export const SelectDireccion = ({ direccion, setCanConfirm, setGeoSeleccionada }: Props) => {
    const [resultados, setResultados] = useState<Geolocalizacion[]>([]);
    const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<Geolocalizacion | null>(null);
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
                        const seleccionado = ubicacionSeleccionada?.properties.id === resultado.properties.id;
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
                                    primary={resultado.properties.name}
                                    secondary={seleccionado ? "Dirección seleccionada" : undefined}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>
            )}

            {ubicacionSeleccionada && (
                <Box sx={{ height: 400, borderRadius: 2, overflow: "hidden" }}>
                    <MapContainer
                        center={[
                            ubicacionSeleccionada.geometry.coordinates[0], // lat
                            ubicacionSeleccionada.geometry.coordinates[1], // lon
                        ]}
                        zoom={17}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <RecenterMap
                            lat={ubicacionSeleccionada.geometry.coordinates[0]}
                            lon={ubicacionSeleccionada.geometry.coordinates[1]}
                        />
                        <Marker position={[
                            ubicacionSeleccionada.geometry.coordinates[0],
                            ubicacionSeleccionada.geometry.coordinates[1],
                        ]}>
                            <Popup>
                                <strong>{ubicacionSeleccionada.properties.name}</strong>
                                <br />Dirección seleccionada
                            </Popup>
                        </Marker>
                    </MapContainer>
                </Box>
            )}
            {buscado && resultados.length === 0 && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                No se encontraron resultados para la dirección ingresada.
            </Alert>
            )}
        </Box>
    );
};
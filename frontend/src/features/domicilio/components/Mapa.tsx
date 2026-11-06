import { useEffect } from "react";
import { useMap, MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Box } from "@mui/material";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});



type Props = {
    latitud: number
    longitud: number
    nombre: string
}

type RecenterMapProps = {
    latitud: number
    longitud: number
}

const RecenterMap = ({ latitud, longitud }: RecenterMapProps) => {
    const map = useMap();

    useEffect(() => {
        map.setView([latitud, longitud], 17, { animate: true });
    }, [latitud, longitud, map]);

    return null;
};

export const Mapa = ({ latitud, longitud, nombre } : Props) => {
    return (
    <Box
        sx={{
            height: { xs: 240, sm: 300, lg: 360 },
            borderRadius: 2,
            overflow: "hidden",
        }}
    >
        <MapContainer
            center={[
                latitud,
                longitud
            ]}
            zoom={17}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                // Identifica el sitio ante OSM sin compartir rutas ni parámetros.
                referrerPolicy="strict-origin"
            />
            <RecenterMap
                latitud={latitud}
                longitud={longitud}
            />
            <Marker position={[
                latitud,
                longitud,
            ]}>
                <Popup>
                    <strong>{nombre}</strong>
                </Popup>
            </Marker>
        </MapContainer>
    </Box>
)}

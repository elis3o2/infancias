import { useEffect } from "react";
import { useMap, MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Box } from "@mui/material";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;
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

export const Mapa = ({ latitud, longitud, nombre } : Props) => {
    
    function RecenterMap({lat, lon }: { lat: number; lon: number }) {
        const map = useMap();
        useEffect(() => {
            map.setView([lat, lon], 17, { animate: true });
        }, [lat, lon, map]);
        return null;
    }
    
    return (
    <Box sx={{ height: 400, borderRadius: 2, overflow: "hidden" }}>
        <MapContainer
            center={[
                latitud,
                longitud
            ]}
            zoom={17}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap
                lat={latitud}
                lon={longitud}
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
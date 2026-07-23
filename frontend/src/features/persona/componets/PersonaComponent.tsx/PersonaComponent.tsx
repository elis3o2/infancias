import { useEffect, useState } from "react";
import { Box, Card, CardContent, Divider, Stack } from "@mui/material";
import type { Ciudadano, Persona } from "@/features/persona/types";
import { PersonaForm } from "./components/PersonaForm";
import { PersonaCard } from "./components/PersonaCard";
import type { Geolocalizacion } from "@/features/domicilio/types";
import { BuscarPersona } from "./components/BuscarPersona/BuscarPersona";
import type { Setter } from "@/common/types";

type Props = {
  setPersona: Setter<Persona | null>
  geoSeleccionada: Geolocalizacion | null
  setGeoSeleccionada: Setter<Geolocalizacion | null>
  setFinishPersona: Setter<boolean>
}


// ──────────────────────────────────────────
// Component
// ──────────────────────────────────────────
export const PersonaComponent = ({ setPersona, geoSeleccionada, setGeoSeleccionada, setFinishPersona }: Props) => {
  const [ciudadano, setCiudadano] = useState<Ciudadano | null>(null)
  const [telefono, setTelefono] = useState("")

  // dirección
  const [finishDireccion, setFinishDireccion] = useState(false)
  const [direccionRenaper, setDireccionRenaper] = useState("")

  useEffect(() => {
    if (!ciudadano) return

    setPersona((prev) => ({
      ...prev,
      dni: ciudadano.nroDocumento,
      nombre: ciudadano.nombre,
      apellido: ciudadano.apellido,
      sexo: ciudadano.sexo,
      fecha_nacimiento: ciudadano.fechaNacimiento,
    }))
  }, [ciudadano, setPersona])

  useEffect(() => {
    setPersona((prev) => ({
      ...prev,
      telefono,
    }))
  }, [telefono, setPersona])


  useEffect(() => {
    if (ciudadano) {
      setDireccionRenaper(ciudadano.domicilio);
    }
  }, [ciudadano])

  useEffect(()=> {
    setFinishPersona(finishDireccion)
  }, [finishDireccion])

  return (
      <Box sx={{ width: "100%" }}>
        {/* Header */}
      {!ciudadano &&
        <BuscarPersona
          ciudadano={ciudadano}
          setCiudadano={setCiudadano}
          lookSexo= {null}
        />}

        {/* Result Card */}
        {ciudadano && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              background: "#ffffff",
              border: "1px solid #bfdbfe",
              boxShadow: "0 1px 4px rgba(59,130,246,0.1)",
              overflow: "hidden",
            }}
          > 
           <PersonaCard
              ciudadano={ciudadano}
              setCiudadano={setCiudadano}
              setFinishPersona={setFinishPersona}
            />

            <Divider sx={{ borderColor: "#e2e8f0" }} />

            {/* Data rows */}
            <CardContent sx={{ p: 3 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
                <PersonaForm
                  ciudadano={ciudadano}
                  domicilio={geoSeleccionada?.properties?.name}
                  finishDireccion={finishDireccion}
                  setFinishDireccion={setFinishDireccion}
                  telefono={telefono}
                  setTelefono={setTelefono}
                />
              </Stack>
            
            {!finishDireccion && 
              <DireccionComponent
                direccionRenaper={direccionRenaper}
                setFinishDireccion={setFinishDireccion}
                setGeoSeleccionada={setGeoSeleccionada}
              />}
            </CardContent>
          </Card>)}
      </Box>
  );
}
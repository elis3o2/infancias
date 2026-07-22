import { useState } from 'react'
import {Card, CardContent, Stack, Alert} from '@mui/material'
import type { Setter } from '@/common/types'
import type { Ciudadano } from '@/features/persona/types'
import { DniSexoForm } from './components/DniSexoForm'
import { PersonaButtons } from './components/PersonaButtons'
import { getCiudadano } from '@/features/persona/api'

type Props = {
    ciudadano: Ciudadano
    setCiudadano: Setter<Ciudadano>
    lookSexo: "M" | "F" | null
}

export const BuscarPersona = ({ciudadano, setCiudadano, lookSexo}: Props) => {
  
  const [dni, setDni] = useState("")
  const [sexo, setSexo] = useState<"M" | "F" | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const dniInvalid = dni !== "" && !/^\d{7,8}$/.test(dni);
  const canSearch = dni.length >= 7 && sexo !== "" && !dniInvalid && !loading;

  const submitted = ciudadano !== null || error !== null;

  const handleBuscar = async () => {
    if (!dni || !sexo || dniInvalid) return;

    setLoading(true);
    setError(null);
    setCiudadano(null);

    try {
      const data = await getCiudadano(dni, sexo);
      setCiudadano(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se encontró el ciudadano o ocurrió un error.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setDni("");
    setSexo("");
    setCiudadano(null);
    setError(null);
  };

  return (<>
    <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* DNI Field Sexo Field */}
            
            <DniSexoForm
              dni={dni}
              setDni={setDni}
              sexo={sexo}
              setSexo={setSexo}
              submitted={submitted}
              lookSexo={lookSexo}
            />

            {/* Buttons */}
            <PersonaButtons
              loading={loading}
              ciudadano={ciudadano}
              error={error}
              handleBuscar={handleBuscar}
              handleLimpiar={handleLimpiar}
              canSearch={canSearch}
            />
        </Stack>
      </CardContent>
    </Card>
    {error && (
      <Alert severity="error" sx={{ borderRadius: 3, mb: 3 }}>
        {error}
      </Alert>
    )}
    </>
  )
}
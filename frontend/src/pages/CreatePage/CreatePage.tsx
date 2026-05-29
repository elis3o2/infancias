import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  TextField,
  Typography,
  Alert,
  Chip,
  Avatar,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BadgeIcon from "@mui/icons-material/Badge";
import CheckIcon from "@mui/icons-material/Check";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import { getCiudadano } from "../../features/persona/api";
import type { Ciudadano } from "../../features/persona/types";
import { BuscarDireccion } from "./components/Direccion";
import { SexoForm } from "./components/SexoForm";
import { PersonaForm } from "./components/PersonaForm";


// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

const getInitials = (nombre: string, apellido: string) =>
  `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();

// ──────────────────────────────────────────
// Component
// ──────────────────────────────────────────
export default function BuscarCiudadano() {
  const [dni, setDni] = useState("");
  const [sexo, setSexo] = useState<"M" | "F" | "">("");
  const [ciudadano, setCiudadano] = useState<Ciudadano | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cambiar dirección
  const [mostrarFormDireccion, setMostrarFormDireccion] = useState(false);
  const [nuevaDireccion, setNuevaDireccion] = useState("");

  // Validation state
  const dniInvalid = dni !== "" && !/^\d{7,8}$/.test(dni);
  const submitted = ciudadano !== null || error !== null;
  const isLocked = loading || submitted;

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
    setMostrarFormDireccion(false);
    setNuevaDireccion("");
  };

  const handleConfirmar = () => {
    // TODO: lógica de confirmación
  };

  const handleCambiarDireccion = () => {
    setMostrarFormDireccion((prev) => !prev);
    setNuevaDireccion("");
  };


  const canSearch = dni.length >= 7 && sexo !== "" && !dniInvalid && !loading;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 560 }}>
        {/* Header */}
        <Stack alignItems="center" spacing={1} sx={{ mb: 4 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: "primary.main",
              boxShadow: "0 0 24px rgba(59,130,246,0.3)",
            }}
          >
            <BadgeIcon fontSize="large" />
          </Avatar>
          <Typography
            variant="h5"
            fontWeight={700}
            color="text.primary"
            letterSpacing={-0.5}
          >
            Consulta de Ciudadano
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ingrese DNI y sexo para buscar los datos del ciudadano
          </Typography>
        </Stack>

        {/* Search Card */}
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
              {/* DNI Field */}
              <TextField
                label="Número de Documento"
                placeholder="Ej: 12345678"
                value={dni}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                  setDni(val);
                }}
                error={dniInvalid}
                helperText={dniInvalid ? "El DNI debe tener entre 7 y 8 dígitos" : ""}
                inputProps={{ inputMode: "numeric", maxLength: 8 }}
                fullWidth
                variant="outlined"
                disabled={isLocked}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "text.primary",
                    "& fieldset": { borderColor: "#cbd5e1" },
                    "&:hover fieldset": { borderColor: "#94a3b8" },
                    "&.Mui-focused fieldset": { borderColor: "primary.main" },
                  },
                  "& .MuiInputLabel-root": { color: "text.secondary" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
                  "& .MuiFormHelperText-root": { color: "error.main" },
                }}
              />

              {/* Sex Selector */}
             <SexoForm 
              submitted={submitted}
              sexo={sexo}
              setSexo={setSexo}
              isLocked={isLocked}
             />

              {/* Buttons */}
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={
                    loading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SearchIcon />
                    )
                  }
                  onClick={handleBuscar}
                  disabled={!canSearch}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: "none",
                    py: 1.5,
                    boxShadow: canSearch
                      ? "0 0 20px rgba(59,130,246,0.3)"
                      : "none",
                  }}
                >
                  {loading ? "Buscando…" : "Buscar"}
                </Button>

                {(ciudadano || error) && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleLimpiar}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      py: 1.5,
                      borderColor: "#cbd5e1",
                      color: "text.secondary",
                      "&:hover": { borderColor: "#94a3b8" },
                    }}
                  >
                    Limpiar
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ borderRadius: 3, mb: 3 }}>
            {error}
          </Alert>
        )}

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
            {/* Card Header */}
            <Box
              sx={{
                background: "linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%)",
                px: 3,
                py: 2.5,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 48,
                  height: 48,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  boxShadow: "0 0 16px rgba(59,130,246,0.3)",
                }}
              >
                {getInitials(ciudadano.nombre, ciudadano.apellido)}
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color="text.primary"
                  lineHeight={1.2}
                >
                  {ciudadano.nombre} {ciudadano.apellido}
                </Typography>
                <Chip
                  label={`DNI ${dni}`}
                  size="small"
                  sx={{
                    mt: 0.5,
                    bgcolor: "rgba(59,130,246,0.1)",
                    color: "primary.main",
                    fontSize: "0.7rem",
                    height: 20,
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ borderColor: "#e2e8f0" }} />

            {/* Data rows */}
            <CardContent sx={{ p: 3 }}>
              <PersonaForm
              ciudadano={ciudadano}
              />

              {/* Formulario cambiar dirección */}
              {mostrarFormDireccion && (
                <BuscarDireccion
                  mostrarFormDireccion={mostrarFormDireccion}
                  setMostrarFormDireccion={setMostrarFormDireccion}
                />
              )}

              <Divider sx={{ borderColor: "#e2e8f0", my: 3 }} />

              {/* Action buttons */}
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CheckIcon />}
                  onClick={handleConfirmar}
                  color="success"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: "none",
                    py: 1.25,
                  }}
                >
                  Validar Dirección
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<EditLocationAltIcon />}
                  onClick={handleCambiarDireccion}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: "none",
                    py: 1.25,
                    borderColor: mostrarFormDireccion ? "primary.main" : "#cbd5e1",
                    color: mostrarFormDireccion ? "primary.main" : "text.secondary",
                    "&:hover": { borderColor: "primary.main", color: "primary.main" },
                  }}
                >
                  Cambiar Dirección
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
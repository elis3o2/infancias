import type { Adolescente, Ciudadano, Salud } from "../../types"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  List,
  Stack,
  Typography,
} from "@mui/material"
import BadgeIcon from "@mui/icons-material/Badge"
import WcIcon from "@mui/icons-material/Wc"
import CakeIcon from "@mui/icons-material/Cake"
import PersonIcon from "@mui/icons-material/Person"
import SchoolIcon from "@mui/icons-material/School";
import FactCheckIcon from "@mui/icons-material/FactCheck"
import { getSalud, getCiudadano } from "../../api"
import { useState } from "react"
import { DatoItem } from "@/common/components/DatoItem"
import { Mapa } from "@/features/domicilio/components/Mapa"
import { ValidarButtons } from "../Validacion/ValidarButtons"
import type { Setter } from "@/common/types"

type Props = {
  adolescente: Adolescente
  estado:"confirmado" | "rechazado" | null
  setEstado: Setter<"confirmado" | "rechazado" | null>
  ciudadano: Ciudadano | null
  setCiudadano: Setter<Ciudadano | null>
}

function formatFecha(fecha: string | null | undefined) {
  if (!fecha) return "—";

  const d = new Date(fecha);

  if (isNaN(d.getTime())) return fecha;

  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const anio = d.getUTCFullYear();

  return `${dia}-${mes}-${anio}`;
}

export const AdolescenteCard = ({ adolescente, estado, setEstado, ciudadano, setCiudadano }: Props) => {
  const sexoLabel = adolescente.sexo === "M" ? "Masculino" : "Femenino"
  const [salud, setSalud] = useState<Salud | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleValidar = async () => {
    setLoading(true)
    setError(null)
    try {
      const [ciudadanoRes, saludRes] = await Promise.all([
        getCiudadano(adolescente.dni, adolescente.sexo),
        getSalud(adolescente.dni, adolescente.sexo),
      ])
      setCiudadano(ciudadanoRes)
      setSalud(saludRes)
    } catch (e) {
      setError("No se encontro a la persona.")
      setEstado("rechazado")
    } finally {
      setLoading(false)
    }
  }

return (
  <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
    <CardContent>
      <Stack
        direction="row"
        alignItems="center"
        sx={{ mb: 2, width: "100%"}}
      >
        {/* Título */}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Datos del niño, niña o adolescente
        </Typography>

        {/* Botones */}
       {ciudadano != null &&
       <ValidarButtons estado={estado} setEstado={setEstado}/> }

      </Stack>
        <Stack direction="row" spacing={3}>
          {/* Columna izquierda: datos cargados del adolescente */}
          <Box sx={{ flex: 1 }}>
            <List
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: 3,
                rowGap: 0,
                bgcolor: "action.hover",
                borderRadius: 2,
                px: 2,
                py: 1,
              }}
            >
              <DatoItem icon={<PersonIcon fontSize="small" />} label="Nombre" valor={adolescente.nombre} />
              <DatoItem icon={<PersonIcon fontSize="small" />} label="Apellido" valor={adolescente.apellido} />
              <DatoItem icon={<BadgeIcon fontSize="small" />} label="DNI" valor={adolescente.dni} />
              <DatoItem icon={<WcIcon fontSize="small" />} label="Sexo" valor={sexoLabel} />
              <DatoItem
                icon={<CakeIcon fontSize="small" />}
                label="Fecha de nacimiento"
                valor={formatFecha(adolescente.fecha_nacimiento)}
              />
             <DatoItem
              icon={<SchoolIcon fontSize="small" />}
              label={"Escolarizado"}
              valor={adolescente.escolarizado? "Si" : "No"}
            />
            </List>

            <Button
              onClick={handleValidar}
              disabled={loading}
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FactCheckIcon />}
              sx={{ mt: 3, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              {loading ? "Validando..." : "VALIDAR"}
            </Button>

            {error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
          </Box>

          {/* Columna derecha: comparación contra Registro Civil + Salud */}
          {ciudadano && <Divider orientation="vertical" flexItem />}

          <Collapse
            in={Boolean(ciudadano)}
            orientation="horizontal"
            sx={{ flex: ciudadano ? 1 : 0 }}
          >
            {ciudadano && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                  Validación con RENAPER
                </Typography>

                <List
                  sx={{
                    bgcolor: "background.paper",
                    borderRadius: 2,
                    px: 2,
                    py: 0.5,
                  }}
                >
                  <DatoItem icon={<PersonIcon fontSize="small" />} label="Nombre" valor={ciudadano.nombre} />
                  <DatoItem icon={<PersonIcon fontSize="small" />} label="Apellido" valor={ciudadano.apellido} />
                  <DatoItem icon={<CakeIcon fontSize="small" />} label="Fecha de nacimiento" valor={formatFecha(ciudadano.fechaNacimiento)} />
                </List>

                {ciudadano.fallecido === "SI" && (
                  <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                    La persona esta fallecida.
                  </Alert>
                )}

                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{ mt: 3, mb: 1.5 }}
                >
                  Centro de salud adscripto
                </Typography>


                  {salud?.adscripcion?.length ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {salud.adscripcion.map((a) => (
                        <Chip key={a} label={a} size="small" />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Niniguno.
                    </Typography>
                  )}
              </Box>
            )}
          </Collapse>

        </Stack>
        <Box sx={{ height: 400, width: "100%", mt: 5}}>
            <Mapa
          latitud={adolescente.domicilio.domicilio_validado.coordenada_x}
          longitud={adolescente.domicilio.domicilio_validado.coordenada_y}
          nombre={adolescente.domicilio.nombre}
        />
      </Box>
      </CardContent>
    </Card>
  )
}
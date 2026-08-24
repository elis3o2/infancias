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
  Stack,
  Typography,
} from "@mui/material"
import FactCheckIcon from "@mui/icons-material/FactCheck"
import { getSalud, getCiudadano } from "../../api"
import { useState } from "react"
import { Mapa } from "@/features/domicilio/components/Mapa"
import { ValidarButtons } from "../Validacion/ValidarButtons"
import type { Setter } from "@/common/types"
import { AdolescenteSimpleCard } from "./AdolescenteList"
import type { Domicilio } from "@/features/domicilio/types"
import { DomicilioComponent } from "@/features/domicilio/components/DomicilioComponent"
import { CambiarDomicilio } from "@/features/domicilio/components/CambiarDomicilio"

type Props = {
  adolescente: Adolescente
  estado:"confirmado" | "rechazado" | null
  setEstado: Setter<"confirmado" | "rechazado" | null>
  ciudadano: Ciudadano | null
  setCiudadano: Setter<Ciudadano | null>
  nuevoDomicilio: Domicilio | null 
  setNuevoDomicilio: Setter<Domicilio | null>
}


export const AdolescenteCard = ({ adolescente, estado, setEstado, ciudadano, setCiudadano, nuevoDomicilio, setNuevoDomicilio }: Props) => {
  const [salud, setSalud] = useState<Salud | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finishDomicilio, setFinishDomicilio] = useState(false)

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
            <AdolescenteSimpleCard
              nombre={adolescente.nombre}
              apellido={adolescente.apellido}
              dni={adolescente.dni}
              sexo={adolescente.sexo}
              escolarizado={adolescente.escolarizado}
              fecha_nacimiento={adolescente.fecha_nacimiento}
              domicilio={adolescente.domicilio.nombre}
            />

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

                <AdolescenteSimpleCard
                  nombre={ciudadano.nombre}
                  apellido={ciudadano.apellido}
                  fecha_nacimiento={ciudadano.fechaNacimiento}
                />

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
<CambiarDomicilio domicilio={adolescente.domicilio} nuevoDomicilio={nuevoDomicilio} setNuevoDomicilio={setNuevoDomicilio}/>
      </CardContent>





    </Card>
  )
}
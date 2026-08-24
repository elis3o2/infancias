import type { Hermano, Ciudadano } from "../../types"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  Divider,
  Stack,
  Typography,
} from "@mui/material"
import FactCheckIcon from "@mui/icons-material/FactCheck"
import { getCiudadano } from "../../api"
import { useState } from "react"
import { ValidarButtons} from "../Validacion/ValidarButtons"
import type { Setter } from "@/common/types"
import { AdolescenteList } from "../Adolescente/AdolescenteList"
import { AgregarHermano } from "./AgregarHemano"
import { HermanosNuevos } from "./HemanosNuevos"

type Props = {
  hermanos: Hermano[]
  estados: (null | "confirmado" | "rechazado")[]
  setEstados: Setter<(null | "confirmado" | "rechazado")[]>
  ciudadanos: (Ciudadano | null)[]
  setCiudadanos: Setter<(Ciudadano | null)[]>
  nuevosHermanos: Hermano[]
  setNuevosHermanos: Setter<Hermano[]>
}


export const HermanoCard = ({ hermanos, estados, setEstados, ciudadanos, setCiudadanos, nuevosHermanos, setNuevosHermanos }: Props) => {
  
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)
  const [errores, setErrores] = useState<(string | null)[]>(hermanos.map(() => null))

  const handleValidar = async (hermano: Hermano, index: number) => {
    setLoadingIndex(index)
    setErrores((prev) => {
      const next = [...prev]
      next[index] = null
      return next
    })
    try {
      const ciudadanoRes = await getCiudadano(hermano.dni, hermano.sexo)
      setCiudadanos((prev) => {
        const next = [...prev]
        next[index] = ciudadanoRes
        return next
      })
    } catch (e) {
      setErrores((prev) => {
        const next = [...prev]
        next[index] = "No se encontro a la persona."
        return next
      })
      setEstado("rechazado", index)
    } finally {
      setLoadingIndex(null)
    }
  }


  function setEstado (e: null | "confirmado" | "rechazado", index){
    setEstados((prev) => {
      const next = [...prev]
      next[index] = e
      return next
    })
  }

    return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" lineHeight={1.2}>
            Hermanos
          </Typography>
        </Stack>

        <Stack spacing={3}>
          {hermanos.map((hermano, index) => {
            const ciudadano = ciudadanos[index]
            const loading = loadingIndex === index
            const error = errores[index]
            return (
              <Stack direction="row" spacing={2} key={hermano.dni ?? index}>
                <Box sx={{ flex: 1 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      Datos del hermano
                    </Typography>

                  </Stack>
                      
                      <AdolescenteList
                        nombre={hermano.nombre}
                        apellido={hermano.apellido}
                        dni={hermano.dni}
                        sexo={hermano.sexo}
                        fecha_nacimiento={hermano.fecha_nacimiento}
                      />

                    <Button
                      onClick={() => handleValidar(hermano, index)}
                      disabled={loading}
                      variant="contained"
                      startIcon={
                        loading ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <FactCheckIcon />
                        )
                      }
                      sx={{
                        mt: 3,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      {loading ? "Validando..." : "VALIDAR"}
                    </Button>

                  {error && (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}
                </Box>

                {ciudadano && <Divider orientation="vertical" flexItem />}

                <Collapse in={Boolean(ciudadano)} orientation="horizontal" sx={{ flex: ciudadano ? 1 : 0 }}>
                  {ciudadano && (
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                        Validación con RENAPER
                      </Typography>
                      
                      <AdolescenteList
                        nombre={ciudadano.nombre}
                        apellido={ciudadano.apellido}
                        fecha_nacimiento={ciudadano.fechaNacimiento}
                      />

                      {ciudadano.fallecido === "SI" && (
                        <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                          La persona esta fallecida.
                        </Alert>
                      )}
                      <ValidarButtons estado={estados[index]} setEstado={(e) => setEstado(e, index)}/>
                          
                    </Box>
                  )}
                </Collapse>
              </Stack>
            )
          })}
          <Stack spacing={3}>
            {nuevosHermanos.map((hermano, index) => {
              return (
                <Stack direction="row" spacing={2} key={hermano.dni ?? index}>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                        Datos del hermano
                      </Typography>
                    </Stack>

                    <AdolescenteList
                      nombre={hermano.nombre}
                      apellido={hermano.apellido}
                      dni={hermano.dni}
                      sexo={hermano.sexo}
                      fecha_nacimiento={hermano.fecha_nacimiento}
                    />

                    <Button
                      onClick={() =>
                        setNuevosHermanos(nuevosHermanos.filter((_, i) => i !== index))
                      }
                      variant="contained"
                      color="error"
                      sx={{ mt: 2 }}
                    >
                      Eliminar
                    </Button>
                  </Box>
                </Stack>
              )
            })}

            <HermanosNuevos hermanos={nuevosHermanos} setHermanos={setNuevosHermanos} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
import type { Hermano, Ciudadano, Familiar, Persona } from "../../types"
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
import { FamiliarList } from "../Familiar/FamiliarList"
import { CiudadanoList } from "./CiudadanoList"
import { PersonaList } from "./PersonaList"
import { NuevaPersona } from "./NuevaPersona"

type Props = {
  familiares: Familiar[]
  estados: (null | "confirmado" | "rechazado")[]
  setEstados: Setter<(null | "confirmado" | "rechazado")[]>
  ciudadanos: (Ciudadano | null)[]
  setCiudadanos: Setter<(Ciudadano | null)[]>
  nuevosFamiliares: Persona[]
  setNuevosFamiliares: Setter<Persona[]>
}


export const ValidarFamiliares = ({ familiares, estados, setEstados, ciudadanos, setCiudadanos, nuevosFamiliares, setNuevosFamiliares }: Props) => {
  
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)
  const [errores, setErrores] = useState<(string | null)[]>(familiares.map(() => null))

  const handleValidar = async (familiar: Familiar, index: number) => {
    if (!familiar.dni) return
    setLoadingIndex(index)
    setErrores((prev) => {
      const next = [...prev]
      next[index] = null
      return next
    })
    try {
      const ciudadanoRes = await getCiudadano(familiar.dni, familiar.sexo)
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


  function setEstado (e: null | "confirmado" | "rechazado", index: number){
    setEstados((prev) => {
      const next = [...prev]
      next[index] = e
      return next
    })
  }

    return (
    <Card sx={{ minWidth: 1028, borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent:"space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ lineHeight: 1.2}}>
            Familiares / referentes
          </Typography>
        </Stack>

        <Stack spacing={3}>
          {familiares.map((familiar, index) => {
            const ciudadano = ciudadanos[index]
            const loading = loadingIndex === index
            const error = errores[index]
            return (
              <Stack direction="row" spacing={2} key={index}>
                <Box sx={{ flex: 1 }}>
                  <Stack
                    direction="row"
                    sx={{ mb: 1, alignItems: "center" }}
                  >
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      Datos del Familiar
                    </Typography>

                  </Stack>
                      
                      <FamiliarList
                        familiar={familiar}
                      />

                    {familiar.dni &&
                    <Button
                      onClick={() => handleValidar(familiar, index)}
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
                    </Button> }

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
                      <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
                        Validación con RENAPER
                      </Typography>
                      
                      <CiudadanoList
                        ciudadano={ciudadano}
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
        </Stack>

        <Stack spacing={3}>
          {nuevosFamiliares.map((familiar, index) => {
            return (
              <Stack direction="row" spacing={2} key={index}>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" sx={{ mb: 1, alignItems: "center" }}>
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      Datos del hermano
                    </Typography>
                  </Stack>

                  <PersonaList
                    persona={familiar}
                  />

                  <Button
                    onClick={() =>
                      setNuevosFamiliares(nuevosFamiliares.filter((_, i) => i !== index))
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

          <NuevaPersona personas={nuevosFamiliares} setPersonas={setNuevosFamiliares} />
        </Stack>
      </CardContent>
    </Card>
  )
}
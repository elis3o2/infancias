import type { AdolescenteCrud, Ciudadano, PersonaCreate, Salud } from "../../types"
import { Alert, Box, Button, Chip, CircularProgress, Collapse, Divider, Stack, Typography } from "@mui/material"
import FactCheckIcon from "@mui/icons-material/FactCheck"
import { getSalud, getCiudadano } from "../../api"
import { useEffect, useState } from "react"
import { ValidarButtons } from "../Validacion/ValidarButtons"
import type { Setter } from "@/common/types"
import { AdolescenteList } from "../Adolescente/AdolescenteList"
import { CiudadanoList } from "./CiudadanoList"
import { ciudadanoToPersona } from "../../utils"


type Props = {
  adolescente: AdolescenteCrud
  estado:"confirmado" | "rechazado" | null
  setEstado: Setter<"confirmado" | "rechazado" | null>
  setPersona: Setter<PersonaCreate | null>
}

export const ValidarAdolescenteDatos = ({ adolescente, estado, setEstado, setPersona }: Props) => {
    
    const [ciudadano, setCiudadano] = useState<Ciudadano | null>(null)
    const [salud, setSalud] = useState<Salud | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(()=>  {
      if (ciudadano && estado ==  "confirmado")
        setPersona(ciudadanoToPersona(ciudadano))
      else
        setPersona(null)
    }, [ciudadano, estado, setPersona])

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
    } catch {
        setError("No se encontraron datos en RENAPER. La persona queda pendiente de validación.")
    } finally {
        setLoading(false)
    }
    }
    
    return ( <>
    <Stack
        direction="row"
        sx={{ mb: 2, width: "100%", alignItems: "center"}}
      >

        {/* Botones */}
       {ciudadano != null &&
       <ValidarButtons estado={estado} setEstado={setEstado}/> }

      </Stack>
        <Stack direction="row" spacing={3}>
          {/* Columna izquierda: datos cargados del adolescente */}
          <Box sx={{ flex: 1 }}>
            <AdolescenteList
              adolescente={adolescente}
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
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
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

                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600,mt: 3, mb: 1.5 }}
                >
                  Centro de salud adscripto
                </Typography>


                  {salud?.adscripcion?.length ? (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap"}} useFlexGap>
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
    </>)
}

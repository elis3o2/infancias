import type { AdolescenteCrud, PersonaCreate } from "../../types"
import type { Ciudadano } from "@/features/api_externa/types"
import { Alert, Box, Button, CircularProgress, Collapse, Divider, Stack, Typography } from "@mui/material"
import FactCheckIcon from "@mui/icons-material/FactCheck"
import { getCiudadano } from "@/features/api_externa/api"
import { useEffect, useMemo, useState } from "react"
import { ValidarButtons } from "../Validacion/ValidarButtons"
import type { Setter } from "@/common/types"
import { AdolescenteList } from "../Adolescente/AdolescenteList"
import { CiudadanoList } from "./CiudadanoList"
import { ciudadanoToPersona } from "../../utils"
import { useSaludPersona } from "@/features/api_externa/useSaludPersona"
import { EstadoHistoriasClinicas } from "@/features/api_externa/EstadoHistoriasClinicas"
import { DatosSalud } from "../DatosSalud"


type Props = {
  adolescente: AdolescenteCrud
  estado:"confirmado" | "rechazado" | null
  setEstado: Setter<"confirmado" | "rechazado" | null>
  setPersona: Setter<PersonaCreate | null>
}

export const ValidarAdolescenteDatos = ({ adolescente, estado, setEstado, setPersona }: Props) => {
    
    const [ciudadano, setCiudadano] = useState<Ciudadano | null>(null)
    const persona = useMemo(() => ciudadano ? ciudadanoToPersona(ciudadano) : null, [ciudadano])
    const historias = useSaludPersona(persona)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(()=>  {
      if (historias.persona && !historias.cargando && estado == "confirmado")
        setPersona(historias.persona)
      else
        setPersona(null)
    }, [historias.persona, historias.cargando, estado, setPersona])

    const handleValidar = async () => {
    setLoading(true)
    setError(null)
    setCiudadano(null)
    setEstado(null)
    try {
        const ciudadanoRes = await getCiudadano(adolescente.dni, adolescente.sexo)
        setCiudadano(ciudadanoRes)
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
       {ciudadano != null && !historias.cargando &&
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

                <EstadoHistoriasClinicas {...historias} />
                {historias.persona && <DatosSalud persona={historias.persona} />}
              </Box>
            )}
          </Collapse>
        </Stack>
    </>)
}

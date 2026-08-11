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
  List,
  Stack,
  Typography,
} from "@mui/material"
import BadgeIcon from "@mui/icons-material/Badge"
import WcIcon from "@mui/icons-material/Wc"
import CakeIcon from "@mui/icons-material/Cake"
import PersonIcon from "@mui/icons-material/Person"
import FactCheckIcon from "@mui/icons-material/FactCheck"
import { getCiudadano } from "../../api"
import { useState } from "react"
import { DatoItem } from "@/common/components/DatoItem"
import { ValidarButtons} from "../Validacion/ValidarButtons"
import type { Setter } from "@/common/types"

type Props = {
  hermanos: Hermano[]
  estados: (null | "confirmado" | "rechazado")[]
  setEstados: Setter<(null | "confirmado" | "rechazado")[]>
  ciudadanos: (Ciudadano | null)[]
  setCiudadanos: Setter<(Ciudadano | null)[]>
}

function formatFecha(fecha: string | null | undefined) {
  if (!fecha) return "—"
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return fecha
  const dia = String(d.getUTCDate()).padStart(2, "0")
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0")
  const anio = d.getUTCFullYear()
  return `${dia}-${mes}-${anio}`
}

export const HermanoCard = ({ hermanos, estados, setEstados, ciudadanos, setCiudadanos }: Props) => {
  
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

  function sexoLabel(h: Hermano) {
    return h.sexo === "M" ? "Masculino" : "Femenino"
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
            console.log(hermano)
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
                      <DatoItem icon={<PersonIcon fontSize="small" />} label="Nombre" valor={hermano.nombre} />
                      <DatoItem icon={<PersonIcon fontSize="small" />} label="Apellido" valor={hermano.apellido} />
                      <DatoItem icon={<BadgeIcon fontSize="small" />} label="DNI" valor={hermano.dni} />
                      <DatoItem icon={<WcIcon fontSize="small" />} label="Sexo" valor={sexoLabel(hermano)} />
                      <DatoItem icon={<CakeIcon fontSize="small" />} label="Fecha de nacimiento" valor={formatFecha(hermano.fecha_nacimiento)} />
                    </List>

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
                      <ValidarButtons estado={estados[index]} setEstado={(e) => setEstado(e, index)}/>
                          
                    </Box>
                  )}
                </Collapse>
              </Stack>
            )
          })}
        </Stack>
      </CardContent>
    </Card>
  )
}
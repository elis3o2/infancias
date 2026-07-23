import type { Setter } from "@/common/types"
import type { Institucion, TipoInstitucion } from "../types"
import { getTipoInstitucionAll, getInstitucionByTipo } from '../api'
import { useEffect, useState } from "react"
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Stack,
  CircularProgress,
} from "@mui/material"

type Props = {
  institucion: Institucion | null
  setInstitucion: Setter<Institucion | null>
}

type Modo = "seleccionar" | "cargar"

export const LookInstitucion = ({ institucion, setInstitucion }: Props) => {
  const [tipos, setTipos] = useState<TipoInstitucion[]>([])
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoInstitucion | null>(null)

  const [instituciones, setInstituciones] = useState<Institucion[]>([])
  const [loadingInstituciones, setLoadingInstituciones] = useState(false)

  const [modo, setModo] = useState<Modo>("seleccionar")
  const [nombre, setNombre] = useState("")
  const [domicilio, setDomicilio] = useState("")
  const [guardando, setGuardando] = useState(false)

  // Cargar tipos al montar
  useEffect(() => {
    getTipoInstitucionAll().then(setTipos)
  }, [])

  // Cargar instituciones cuando cambia el tipo
  useEffect(() => {
    if (!tipoSeleccionado) {
      setInstituciones([])
      setInstitucion(null)
      return
    }
    setLoadingInstituciones(true)
    getInstitucionByTipo(tipoSeleccionado.id)
      .then(setInstituciones)
      .finally(() => setLoadingInstituciones(false))
  }, [tipoSeleccionado])

  const handleTipoChange = (id: number | string) => {
    const tipo = tipos.find((t) => t.id === id) ?? null
    setTipoSeleccionado(tipo)
    setInstitucion(null)
    setModo("seleccionar")
  }

  const handleGuardarNueva = async () => {
    if (!tipoSeleccionado || !nombre.trim() || !domicilio.trim()) return
    setGuardando(true)
    try {
      const nueva = await createInstitucion({
        nombre: nombre.trim(),
        domicilio: domicilio.trim(),
        tipoId: tipoSeleccionado.id,
      })
      setInstituciones((prev) => [...prev, nueva])
      setInstitucion(nueva)
      setNombre("")
      setDomicilio("")
      setModo("seleccionar")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 1028 }}>
      <FormControl fullWidth>
        <InputLabel id="tipo-institucion-label">Tipo de institución</InputLabel>
        <Select
          labelId="tipo-institucion-label"
          label="Tipo de institución"
          value={tipoSeleccionado?.id ?? ""}
          onChange={(e) => handleTipoChange(e.target.value)}
        >
          {tipos.map((tipo) => (
            <MenuItem key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {tipoSeleccionado && (
        <>
          <ToggleButtonGroup
            value={modo}
            exclusive
            onChange={(_, value) => value && setModo(value)}
            size="small"
          >
            <ToggleButton value="seleccionar">Seleccionar existente</ToggleButton>
            <ToggleButton value="cargar">Cargar nueva</ToggleButton>
          </ToggleButtonGroup>

          {modo === "seleccionar" && (
            <Autocomplete
              key={tipoSeleccionado?.id ?? "none"}
              options={instituciones}
              getOptionLabel={(option) => option.nombre}
              loading={loadingInstituciones}
              value={institucion}
              onChange={(_, value) => setInstitucion(value)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Institución"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingInstituciones ? <CircularProgress size={18} /> : null}
                        {params.InputProps?.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}

          {modo === "cargar" && (
            <Stack spacing={2}>
              <TextField
                label="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                fullWidth
              />
              <TextField
                label="Domicilio"
                value={domicilio}
                onChange={(e) => setDomicilio(e.target.value)}
                fullWidth
              />
              <Box>
                <Button
                  variant="contained"
                  onClick={handleGuardarNueva}
                  disabled={!nombre.trim() || !domicilio.trim() || guardando}
                >
                  {guardando ? "Guardando..." : "Guardar institución"}
                </Button>
              </Box>
            </Stack>
          )}
        </>
      )}
    </Stack>
  )
}
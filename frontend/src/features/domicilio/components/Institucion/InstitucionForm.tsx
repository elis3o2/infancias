import type { Setter } from "@/common/types"
import type { Institucion, InstitucionCreate } from "../../types"
import { getInstitucionByTipo } from '../../api'
import { useEffect, useState } from "react"
import {  Autocomplete, TextField, ToggleButtonGroup, ToggleButton, Stack, CircularProgress, Button } from "@mui/material"
import { TipoInstitucionComponent } from "../TipoInstitucionComponent"
import { TelefonoComponent } from "@/features/persona/componets/TelefonoComponent"

type Props = {
  setInstitucion: Setter<Institucion | InstitucionCreate | null>
  setFinshInstitucion: Setter<boolean>
}
type Modo = "seleccionar" | "cargar"

export const InstitucionForm = ({ setInstitucion, setFinshInstitucion }: Props) => {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<number | null>(null)

  const [instituciones, setInstituciones] = useState<Institucion[]>([])
  const [loadingInstituciones, setLoadingInstituciones] = useState(false)

  const [modo, setModo] = useState<Modo>("seleccionar")
  const [nombre, setNombre] = useState("")
  const [domicilio, setDomicilio] = useState("")
  const [institucionSeleccionada, setInstitucionSeleccionada] = useState<Institucion | null>(null)
  const [telefono, setTelefono] = useState("")
  
  const formCompleto = (modo == "seleccionar" && institucionSeleccionada) || 
                      (modo == "cargar" && domicilio != "" && nombre != "" && telefono.length == 10 && tipoSeleccionado != null)
  

  function handleCargar () {
    if ( modo == "cargar"){
      const ins : InstitucionCreate = {nombre, domicilio: { nombre: domicilio }, id_tipo: tipoSeleccionado, telefono}
      setInstitucion(ins)
    }
    else{
      console.log(institucionSeleccionada)
      setInstitucion(institucionSeleccionada)
    }
    setFinshInstitucion(true)
  }

  // Cargar instituciones cuando cambia el tipo
  useEffect(() => {
    if (!tipoSeleccionado) {
      setInstituciones([])
      setInstitucion(null)
      return
    }
    setLoadingInstituciones(true)
    getInstitucionByTipo(tipoSeleccionado)
      .then(setInstituciones)
      .finally(() => setLoadingInstituciones(false))
    setInstitucion(null)
    setInstitucionSeleccionada(null)
  }, [tipoSeleccionado])


  return (
    <Stack spacing={2} sx={{ minWidth: 1028 }}>
      <TipoInstitucionComponent
        tipoSeleccionado={tipoSeleccionado}
        setTipoSeleccionado={setTipoSeleccionado}
      />

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
              key={tipoSeleccionado ?? "none"}
              options={instituciones}
              getOptionLabel={(option) => option.nombre}
              loading={loadingInstituciones}
              value={institucionSeleccionada}
              onChange={(_, value) => setInstitucionSeleccionada(value)}
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
              <TelefonoComponent telefono={telefono} setTelefono={setTelefono}/>
            </Stack>
          )}
          <Button
            variant="contained"
            onClick={handleCargar}
            disabled={!formCompleto}
            fullWidth
          >
            Guardar
          </Button>
        </>
      )}
    </Stack>
  )
}
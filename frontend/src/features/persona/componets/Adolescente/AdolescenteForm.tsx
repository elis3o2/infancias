import type { AdolescenteCreate } from "../../types"
import type { Setter } from "@/common/types"
import { DniForm } from "../DniForm"
import { SexoForm } from "../SexoForm"
import { useState } from "react"
import { Card, CardContent, CardActions, Stack, TextField, Button, FormControlLabel, Switch } from "@mui/material"
import { DomicilioComponent } from "@/features/domicilio/components/DomicilioComponent"
import { NombreForm } from "../NombreForm"

type Props = {
  adolescente: AdolescenteCreate
  setAdolescente: Setter<AdolescenteCreate>
  setFinishAdolescente: Setter<boolean>
}

export const AdolescenteForm = ({ adolescente, setAdolescente, setFinishAdolescente }: Props) => {
  const [finishDomicilio, setFinishDomicilio] = useState(false)

  function setNombre (nombre) { 
    setAdolescente({ ...adolescente, nombre })
  }  
  function setApellido (apellido) {
    setAdolescente({ ...adolescente, apellido })
  } 
  function setDni (dni) {
    setAdolescente({ ...adolescente, dni })
  }
  function setSexo (sexo) {
    setAdolescente({ ...adolescente, sexo })
  }
  function setFechaNacimiento (fecha_nacimiento) {
    setAdolescente({ ...adolescente, fecha_nacimiento })
  }
  function setEscolarizado (escolarizado) {
    setAdolescente({ ...adolescente, escolarizado })
  }
  function setDomicilio (domicilio) {
    setAdolescente({ ...adolescente, domicilio })
  }

  const formCompleto =
    adolescente.nombre.trim() !== "" &&
    adolescente.apellido.trim() !== "" &&
    (adolescente.dni.length == 7 || adolescente.dni.length == 8) &&
    adolescente.sexo !== "" &&
    adolescente.fecha_nacimiento.trim() !== "" &&
    finishDomicilio


  const handleCargar = () => {
    if (!formCompleto) return
    setFinishAdolescente(true)
  }

  return (
    <Card  sx={{ minWidth: 1028 }}>
      <CardContent>
        <Stack spacing={2}>
          <NombreForm
            label="Nombre"
            value={adolescente.nombre}
            setNombre={setNombre}
          />
          <NombreForm
            label="Apellido"
            value={adolescente.apellido}
            setNombre={setApellido}
          />
          <DniForm dni={adolescente.dni} setDni={setDni} />
          <SexoForm sexo={adolescente.sexo} setSexo={setSexo} />
          <TextField
            label="Fecha de nacimiento"
            type="date"
            value={adolescente.fecha_nacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={adolescente.escolarizado}
                onChange={(e) => setEscolarizado(e.target.checked)}
              />
            }
            label="Actualmente escolarizado"
          />
          
          <DomicilioComponent 
            domicilio={adolescente.domicilio}
            setDomicilio={setDomicilio}
            finishDomicilio={finishDomicilio}
            setFinishDomicilio={setFinishDomicilio}
          />   
        </Stack>
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          onClick={handleCargar}
          disabled={!formCompleto}
          fullWidth
        >
          Cargar adolescente
        </Button>
      </CardActions>
    </Card>
  )
}
import type { FamiliarCreate, Vinculo } from "../../types"
import type { Setter } from "@/common/types"
import { TelefonoComponent } from "../TelefonoComponent"
import { useState } from "react"
import { Box, Button, IconButton, Stack,TextField, Typography, Card, CardContent, CardActions } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { NombreForm } from "../NombreForm"
import { VinculoForm } from "../VinculoForm"
import { DniForm } from "../DniForm"
import type { Departamento, Provincia } from "@/features/domicilio/types";
import { ProvinciaComponent } from "@/features/domicilio/components/ProvinciaComponent";
import { DepartamentoComponent } from "@/features/domicilio/components/DepartamentoComponet";
import { SexoForm } from "../SexoForm";

type Props = {
  setFamiliar: Setter<FamiliarCreate | null>
  setFinishFamiliar: Setter<boolean>
}

export const FamiliarForm = ({ setFamiliar, setFinishFamiliar }: Props) => {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [telefono, setTelefono] = useState("")
  const [vinculoSeleccionado, setVinculoSeleccionado] = useState<Vinculo | null>(null)
  const [sexo, setSexo] = useState<"M" | "F" | "">("")
  const [dni, setDni] = useState("")
  const [domicilio, setDomicilio] = useState("")
  const [domicilioObservaciones, setDomicilioObservaciones] =useState("")
  const [depatamento, setDepartamento] = useState<Departamento | null> (null)
  const [provincia, setProvincia] = useState<Provincia | null>(null)


  const [camposVisibles, setCamposVisibles] = useState({
    dni: false,
    telefono: false,
    domicilio: false,
    domicilioObservaciones: false,
  });

  const mostrarCampo = (campo: keyof typeof camposVisibles) => {
    setCamposVisibles(prev => ({...prev, [campo]: true}));
  };

  const ocultarCampo = (campo: keyof typeof camposVisibles) => {
    setCamposVisibles(prev => ({...prev, [campo]: false }));
  };
  const formCompleto =
    nombre.trim() !== "" &&
    apellido.trim() !== "" &&
    vinculoSeleccionado !== null &&
    camposVisibles.telefono? telefono.length == 10 : true
    camposVisibles.domicilio? depatamento != null && provincia !=null : true
    camposVisibles.dni? dni.length == 8 || dni.length == 7 : true

  const handleCargar = () => {
    if (!formCompleto) return
    
    let domSeleccionado
    if (domicilio == "" || depatamento == null || vinculoSeleccionado == null)
      domSeleccionado = null
    else
      domSeleccionado = {nombre: domicilio,
                      id_departamento: depatamento.id,
                      domicilio_validado: null,
                      observaciones: domicilioObservaciones != ""? domicilioObservaciones : null
                    }
    setFamiliar({
      nombre,
      apellido,
      telefono: camposVisibles.telefono? telefono : null,
      vinculo: vinculoSeleccionado,
      domicilio: domSeleccionado,
      dni,
      sexo
    })

    setFinishFamiliar(true)
  }

  return (
    <Card  sx={{ minWidth: 1028 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Datos del familiar / referente
      </Typography>
      <Stack spacing={2}>
        <NombreForm
          label="Nombre"
          value={nombre}
          setNombre={setNombre}
        />
        <NombreForm
          label="Apellido"
          value={apellido}
          setNombre={setApellido}
        />
        <SexoForm sexo={sexo} setSexo={setSexo}/>
        {/* DNI */}
        {camposVisibles.dni ? (
          <Box>
            <Stack direction="row" sx={{ alignItems :"center"}} spacing={1}>
              <Box sx= {{flex: 1}}>
                <DniForm
                  dni={dni}
                  setDni={setDni}
                />
              </Box>
              <IconButton
                size="small"
                onClick={() => ocultarCampo("dni")}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        ) : (
          <Button
            size="small"
            variant="outlined"
            onClick={() => mostrarCampo("dni")}
            sx={{ alignSelf: "flex-start" }}
          >
            + Cargar DNI
          </Button>
        )}
        {/* Teléfono */}
        {camposVisibles.telefono ? (
          <Box>
            <Stack direction="row" sx={{ alignItems:"center" }} spacing={1}>
              <Box sx = {{flex: 1}}>
                <TelefonoComponent telefono={telefono} setTelefono={setTelefono}/>
              </Box>
              <IconButton
                size="small"
                onClick={() => ocultarCampo("telefono")}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        ) : (
          <Button
            size="small"
            variant="outlined"
            onClick={() => mostrarCampo("telefono")}
            sx={{ alignSelf: "flex-start" }}
          >
            + Cargar teléfono
          </Button>
        )}

        {/* Domicilio */}
        {camposVisibles.domicilio ? (
          <Stack direction="row" sx={{ alignItems: "center"}} spacing={1}>
            <ProvinciaComponent provincia={provincia} setProvincia={setProvincia}/>
            <DepartamentoComponent 
              departamento={depatamento}
              setDepartamento={setDepartamento}
              id_provincia={provincia == null? null : provincia.id}/>
            <TextField
              fullWidth
              label="Domicilio"
              value={domicilio}
              onChange={(e) => setDomicilio(e.target.value)}
            />

            <IconButton
              size="small"
              onClick={() => ocultarCampo("domicilio")}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        ) : (
          <Button
            size="small"
            variant="outlined"
            onClick={() => mostrarCampo("domicilio")}
            sx={{ alignSelf: "flex-start" }}
          >
            + Cargar domicilio
          </Button>
        )}

        {/* Observaciones domicilio */}
        {camposVisibles.domicilioObservaciones ? (
          <Stack direction="row" sx={{alignItems:"center"}} spacing={1}>
            <TextField
              fullWidth
              label="Observaciones del domicilio"
              value={domicilioObservaciones}
              onChange={(e) => setDomicilioObservaciones(e.target.value)}
              multiline
              rows={2}
            />

            <IconButton
              size="small"
              onClick={() => ocultarCampo("domicilioObservaciones")}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        ) : (
          <Button
            size="small"
            variant="outlined"
            onClick={() => mostrarCampo("domicilioObservaciones")}
            sx={{ alignSelf: "flex-start" }}
          >
            + Cargar observaciones del domicilio
          </Button>
        )}

        <VinculoForm
          vinculoSeleccionado={vinculoSeleccionado}
          setVinculoSeleccionado={setVinculoSeleccionado}
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
          Cargar familiar / referente
        </Button>
      </CardActions>
    </Card>
  )
}
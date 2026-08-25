import type { FamiliarCreate, Vinculo } from "../../types"
import type { Setter } from "@/common/types"
import { useState } from "react"
import { Button, Stack, Card, CardContent, CardActions } from "@mui/material";
import { NombreForm } from "../NombreForm"
import { VinculoForm } from "../VinculoForm"
import type { Departamento, Provincia } from "@/features/domicilio/types";
import { SexoForm } from "../SexoForm";
import { DniOpcionalForm } from "../DniOpcionalForm";
import { TelefonoOpcionalForm } from "../TelefonoOpcionalForm";
import { DomicilioOpcionalForm } from "@/features/domicilio/components/DomicilioOpcionalForm";

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
  const [depatamento, setDepartamento] = useState<Departamento | null> (null)
  const [provincia, setProvincia] = useState<Provincia | null>(null)


  const [camposVisibles, setCamposVisibles] = useState({
    dni: false,
    telefono: false,
    domicilio: false,
  });

  const cambiarCampo = (campo: keyof typeof camposVisibles, valor: boolean) => {
    setCamposVisibles(prev => ({...prev, [campo]: valor}));
  };


  const formCompleto =
    nombre.trim() !== "" &&
    apellido.trim() !== "" &&
    vinculoSeleccionado !== null &&
    (camposVisibles.telefono? telefono.length == 10 : true) &&
    (camposVisibles.domicilio? depatamento != null && provincia !=null : true) &&
    (camposVisibles.dni? dni.length == 8 || dni.length == 7 : true)

  const handleCargar = () => {
    if (!formCompleto) return
    
    let domSeleccionado
    if (domicilio == "" || depatamento == null || vinculoSeleccionado == null)
      domSeleccionado = null
    else
      domSeleccionado = {nombre: domicilio,
                      id_departamento: depatamento.id,
                      domicilio_validado: null,
                      observaciones:  null
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
        <VinculoForm
          vinculoSeleccionado={vinculoSeleccionado}
          setVinculoSeleccionado={setVinculoSeleccionado}
        />

        <SexoForm sexo={sexo} setSexo={setSexo}/>
        {/* DNI */}
        <DniOpcionalForm
          condicion={camposVisibles.dni}
          dni={dni}
          setDni={setDni}
          mostrar={(v) => cambiarCampo("dni", v)}
        />
        {/* Teléfono */}

        <TelefonoOpcionalForm
          condicion={camposVisibles.telefono}
          telefono={telefono}
          setTelefono={setTelefono}
          mostrar={(v) => cambiarCampo("telefono", v)}
        />

        {/* Domicilio */}
        <DomicilioOpcionalForm
          condicion={camposVisibles.domicilio}
          domicilio={domicilio}
          setDomicilio={setDomicilio}
          provincia={provincia}
          setProvincia={setProvincia}
          departamento={depatamento}
          setDepartamento={setDepartamento}
          mostrar={(v) => cambiarCampo("domicilio", v)}
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
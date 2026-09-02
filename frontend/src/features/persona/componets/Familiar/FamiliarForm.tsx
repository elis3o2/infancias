import type { FamiliarCreate, Vinculo } from "../../types"
import type { Setter } from "@/common/types"
import { useState } from "react"
import { Button, Stack } from "@mui/material";
import { NombreForm } from "../NombreForm"
import { VinculoForm } from "../VinculoForm"
import type { Departamento, DomicilioFormData, Provincia } from "@/features/domicilio/types";
import { SexoForm } from "../SexoForm";
import { DniOpcionalForm } from "../DniOpcionalForm";
import { TelefonoOpcionalForm } from "../TelefonoOpcionalForm";
import { DomicilioOpcionalForm } from "@/features/domicilio/components/DomicilioOpcionalForm";

type Props = {
  setFamiliar: Setter<FamiliarCreate | null>
  setFinishFamiliar: Setter<boolean>
  domicilios: DomicilioFormData[]
}

export const FamiliarForm = ({ setFamiliar, setFinishFamiliar, domicilios }: Props) => {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [telefono, setTelefono] = useState("")
  const [vinculoSeleccionado, setVinculoSeleccionado] = useState<Vinculo | null>(null)
  const [sexo, setSexo] = useState<"M" | "F" | "">("")
  const [dni, setDni] = useState("")
  const [domicilio, setDomicilio] = useState<DomicilioFormData>(null)
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
    (camposVisibles.domicilio? domicilio != null : true) &&
    (camposVisibles.dni? dni.length == 8 || dni.length == 7 : true)

  const handleCargar = () => {
    if (!formCompleto) return
    
    setFamiliar({
      nombre,
      apellido,
      telefono: camposVisibles.telefono? telefono : null,
      vinculo: vinculoSeleccionado,
      domicilio: domicilio,
      dni,
      sexo
    })

    setFinishFamiliar(true)
  }

  return (<>
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
          domicilios={domicilios}
          setDomicilio={setDomicilio}
          provincia={provincia}
          setProvincia={setProvincia}
          departamento={depatamento}
          setDepartamento={setDepartamento}
          mostrar={(v) => cambiarCampo("domicilio", v)}
        />
      </Stack>

      <Button
        variant="contained"
        onClick={handleCargar}
        disabled={!formCompleto}
        fullWidth
      >
        Cargar familiar / referente
      </Button>
  </>
  )
}
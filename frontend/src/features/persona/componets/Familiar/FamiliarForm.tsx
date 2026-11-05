import type { FamiliarCreate, Vinculo } from "../../types"
import { useState } from "react"
import { Button, Stack } from "@mui/material";
import { NombreForm } from "../NombreForm"
import { VinculoForm } from "../VinculoForm"
import type { Departamento, DomicilioFormData, Provincia } from "@/features/domicilio/types";
import { SexoForm } from "../SexoForm";
import { DniForm } from "../DniForm";
import { dniFamiliarEsValido } from "../../utils";
import { TelefonoOpcionalForm } from "../TelefonoOpcionalForm";
import { DomicilioOpcionalForm } from "@/features/domicilio/components/DomicilioOpcionalForm";

type Props = {
  setFamiliar: (familiar: FamiliarCreate | null) => void
  setFinishFamiliar: (finalizado: boolean) => void
  domicilios: DomicilioFormData[]
}

export const FamiliarForm = ({ setFamiliar, setFinishFamiliar, domicilios }: Props) => {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [telefono, setTelefono] = useState("")
  const [vinculoSeleccionado, setVinculoSeleccionado] = useState<Vinculo | null>(null)
  const [sexo, setSexo] = useState<"M" | "F" | "">("")
  const [dni, setDni] = useState("")
  const [domicilio, setDomicilio] = useState<DomicilioFormData | null>(null)
  const [departamento, setDepartamento] = useState<Departamento | null>(null)
  const [provincia, setProvincia] = useState<Provincia | null>(null)


  const [camposVisibles, setCamposVisibles] = useState({
    telefono: false,
    domicilio: false,
  });

  const cambiarCampo = (campo: keyof typeof camposVisibles, valor: boolean) => {
    setCamposVisibles(prev => ({...prev, [campo]: valor}));
  };


  const formCompleto =
    nombre.trim() !== "" &&
    apellido.trim() !== "" &&
    dniFamiliarEsValido(dni) &&
    vinculoSeleccionado !== null &&
    (!camposVisibles.telefono || telefono.length === 10) &&
    (!camposVisibles.domicilio || (
      domicilio !== null &&
      domicilio.nombre.trim() !== "" &&
      domicilio.id_departamento !== null
    ))

  const handleCargar = () => {
    if (!formCompleto) return
    
    setFamiliar({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: camposVisibles.telefono ? telefono : null,
      vinculo: vinculoSeleccionado,
      domicilio: camposVisibles.domicilio ? domicilio : null,
      dni: dni.trim(),
      sexo,
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
        <DniForm
          required
          dni={dni}
          setDni={setDni}
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
          departamento={departamento}
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

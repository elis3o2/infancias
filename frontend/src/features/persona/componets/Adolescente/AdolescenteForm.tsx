import type { AdolescenteCreate } from "../../types";
import type { ReactNode } from "react";
import type { Setter } from "@/common/types";
import { DniForm } from "../DniForm";
import { SexoForm } from "../SexoForm";
import { Stack, Button, IconButton, Box } from "@mui/material";
import { FechaInput } from "@/common/components/FechaInput";
import { NombreForm } from "../NombreForm";
import type { DomicilioFormData } from "@/features/domicilio/types";
import { EscolarizadoForm } from "../EscolarizadoForm";
import CloseIcon from "@mui/icons-material/Close";
import { DomicilioComponent } from "@/features/domicilio/components/Domicilio/DomicilioComponent";


type Props = {
  adolescente: AdolescenteCreate;
  setAdolescente: Setter<AdolescenteCreate>;
  onCargar: () => void;
  onCancelar: () => void;
  domicilios: DomicilioFormData[]
  setDomicilios: Setter<DomicilioFormData[]>
  children?: ReactNode
  puedeCargar?: boolean
  textoGuardar?: string
};

export const AdolescenteForm = ({ adolescente, setAdolescente, onCargar, onCancelar, domicilios, setDomicilios,
  children, puedeCargar = true, textoGuardar = "Cargar" }: Props) => {

  function setNombre(nombre: string) {
    setAdolescente({ ...adolescente, nombre });
  }

  function setApellido(apellido: string) {
    setAdolescente({ ...adolescente, apellido });
  }

  function setDni(dni: string) {
    setAdolescente({ ...adolescente, dni });
  }

  function setSexo(sexo: "M" | "F" | "") {
    setAdolescente({ ...adolescente, sexo });
  }

  function setFechaNacimiento(fecha_nacimiento: string) {
    setAdolescente({
      ...adolescente, fecha_nacimiento });
  }

  function setEscolarizado(escolarizado: boolean | null) {
    setAdolescente({
      ...adolescente,
      escolarizado,
    });
  }

  function setDomicilio (domicilio: DomicilioFormData | null) {
    setAdolescente({ ...adolescente, domicilio })
  }

  const handleGuardarDomicilio = (d: DomicilioFormData) => {
      setDomicilio(d)
      setDomicilios((prev) =>
          prev.some((x) => x.nombre === d.nombre) ? prev : [...prev, d]
      )
}
  const formCompleto =
    adolescente.nombre.trim() !== "" &&
    adolescente.apellido.trim() !== "" &&
    (adolescente.dni.length === 7  ||
     adolescente.dni.length === 8) &&
    adolescente.sexo !== "" &&
    adolescente.fecha_nacimiento.trim() !== "" &&
    adolescente.domicilio != null

  const handleCargar = () => {
    if (!formCompleto || !puedeCargar) return;

    onCargar();
  };

return (
    <>
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <IconButton
          onClick={onCancelar}
          color="error"
          aria-label="Cancelar carga"
          size="small"
          sx={{
            border: "1px solid",
            borderColor: "error.main",
            borderRadius: 2,
            p: 0.75,
            "&:hover": {
                backgroundColor: "error.main",
                color: "#fff",
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

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

      <DniForm
        dni={adolescente.dni}
        setDni={setDni}
      />

      <SexoForm
        sexo={adolescente.sexo}
        setSexo={setSexo}
      />

      <FechaInput
        label="Fecha de nacimiento"
        value={adolescente.fecha_nacimiento}
        onChange={setFechaNacimiento}
        max={new Date().toISOString().slice(0, 10)}
        required
        fullWidth
      />

      <EscolarizadoForm
        escolarizado={adolescente.escolarizado}
        setEscolarizado={setEscolarizado}
      />

      <DomicilioComponent
        domicilios={domicilios}
        domicilio={adolescente.domicilio}
        onGuardar={handleGuardarDomicilio}
        onLimpiar={() => setDomicilio(null)}
      />
      {children}

    </Stack>

      <Button
        variant="contained"
        onClick={handleCargar}
        disabled={!formCompleto || !puedeCargar}
        fullWidth
        sx={{ mt: 4 }}
      >
        {textoGuardar}
      </Button>

    </>
  )
};

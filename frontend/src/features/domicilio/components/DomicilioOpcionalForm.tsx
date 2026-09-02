import { useState } from "react";
import { Stack, Box, Button, IconButton, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ProvinciaComponent } from "./ProvinciaComponent";
import { DepartamentoComponent } from "./DepartamentoComponet";
import { DomicilioSelect } from "./Domicilio/DomicilioSelect";

import type { Setter } from "@/common/types";
import type { Departamento, DomicilioFormData, Provincia } from "../types";


type Props = {
  condicion: boolean;
  domicilio: DomicilioFormData | null;
  domicilios: DomicilioFormData[];
  setDomicilio: Setter<DomicilioFormData | null>;
  provincia: Provincia | null;
  setProvincia: Setter<Provincia | null>;
  departamento: Departamento | null;
  setDepartamento: Setter<Departamento | null>;
  mostrar: (valor: boolean) => void;
};

export const DomicilioOpcionalForm = ({ condicion, domicilio, domicilios, setDomicilio,
                        provincia, setProvincia, departamento, setDepartamento, mostrar,}: Props) => {

  const [mostrarFormulario, setMostrarFormulario] = useState(domicilios.length === 0);

  if (!condicion) {
    return (
      <Button
        size="small"
        variant="outlined"
        onClick={() => mostrar(true)}
        sx={{
            alignSelf: "flex-start",
            textTransform: "none",
        }}
      >
        + Cargar domicilio
      </Button>
    );
  }

  const cargarOtroDomicilio = () => {
    setDomicilio(null);
    setProvincia(null);
    setDepartamento(null);
    setMostrarFormulario(true);
  };

  if (mostrarFormulario) {
      return (
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <Box sx={{ flex: 1 }}>
                <ProvinciaComponent
                    provincia={provincia}
                    setProvincia={setProvincia}
                />
            </Box>
            <Box sx={{ flex: 1 }}>
                <DepartamentoComponent
                    departamento={departamento}
                    setDepartamento={setDepartamento}
                    id_provincia={
                        provincia == null
                            ? null
                            : provincia.id
                    }
                />
            </Box>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center" }}
          >
          <TextField
            fullWidth
            label="Domicilio"
            value={domicilio?.nombre ?? ""}
            onChange={(e) => {
                setDomicilio({
                    ...(domicilio ?? {}),
                    nombre: e.target.value,
                } as DomicilioFormData);
            }}
          />
          <IconButton
            size="small"
            onClick={() => {
              setDomicilio(null);
              mostrar(false);
            }}
          >
          <CloseIcon fontSize="small" />
        </IconButton>

      </Stack>

      {domicilios.length > 0 && (
          <Button
              size="small"
              variant="outlined"
              onClick={() =>
                setMostrarFormulario(false)
              }
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
              }}
          >
              Seleccionar domicilio existente
          </Button>
      )}
    </Stack>
    );
  }

  return (
    <DomicilioSelect
      domicilio={domicilio}
      domicilios={domicilios}
      onCargarOtro={cargarOtroDomicilio}
    />
  );
};
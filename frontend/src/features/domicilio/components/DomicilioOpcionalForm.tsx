import { useState } from "react";
import { Stack, Box, Button, IconButton, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ProvinciaComponent } from "./ProvinciaComponent";
import { DepartamentoComponent } from "./DepartamentoComponet";
import { DomicilioSelect } from "./Domicilio/DomicilioSelect";

import type { Departamento, DomicilioFormData, Provincia } from "../types";

type Props = {
  condicion: boolean;
  domicilio: DomicilioFormData | null;
  domicilios?: DomicilioFormData[];
  setDomicilio: (domicilio: DomicilioFormData | null) => void;
  provincia: Provincia | null;
  setProvincia: (provincia: Provincia | null) => void;
  departamento: Departamento | null;
  setDepartamento: (departamento: Departamento | null) => void;
  mostrar: (valor: boolean) => void;
};

const nuevoDomicilio = (): DomicilioFormData => ({
  nombre: "",
  observaciones: null,
  id_departamento: null,
  domicilio_validado: null,
});

export const DomicilioOpcionalForm = ({
  condicion,
  domicilio,
  domicilios = [],
  setDomicilio,
  provincia,
  setProvincia,
  departamento,
  setDepartamento,
  mostrar,
}: Props) => {

  // If a domicile is already associated with the person, show its editable
  // fields. The former `domicilios.length` rule showed the selector instead
  // and could leave the current value invisible after a confirmation.
  const [mostrarFormulario, setMostrarFormulario] = useState(
    domicilio !== null || domicilios.length === 0,
  );
  const [nombreElegido, setNombreElegido] = useState(domicilio?.nombre ?? "");

  const actualizarDomicilio = (cambios: Partial<DomicilioFormData>) => {
    setDomicilio({
      ...(domicilio ?? nuevoDomicilio()),
      ...cambios,
    });
  };

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
        + CARGAR DOMICILIO
      </Button>
    );
  }

  const confirmarSeleccion = () => {
    const encontrado = domicilios.find((d) => d.nombre === nombreElegido);
    if (encontrado) {
      setDomicilio(encontrado);
      setMostrarFormulario(true);
    }
  };

  const cargarOtroDomicilio = () => {
    setDomicilio(nuevoDomicilio());
    setProvincia(null);
    setDepartamento(null);
    setNombreElegido("");
    setMostrarFormulario(true);
  };

  const ocultarDomicilio = () => {
    setDomicilio(null);
    setProvincia(null);
    setDepartamento(null);
    setNombreElegido("");
    setMostrarFormulario(true);
    mostrar(false);
  };

  if (mostrarFormulario) {
      return (
        <Stack spacing={1}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Box sx={{ flex: 1 }}>
                <ProvinciaComponent
                  provincia={provincia}
                  setProvincia={(siguienteProvincia) => {
                    setProvincia(siguienteProvincia);
                    setDepartamento(null);
                    actualizarDomicilio({ id_departamento: null });
                  }}
                />
            </Box>
            <Box sx={{ flex: 1 }}>
                <DepartamentoComponent
                    departamento={departamento}
                    setDepartamento={(siguienteDepartamento) => {
                      setDepartamento(siguienteDepartamento);
                      actualizarDomicilio({
                        id_departamento: siguienteDepartamento?.id ?? null,
                      });
                    }}
                    id_provincia={
                        provincia == null
                            ? null
                            : provincia.id
                    }
                />
            </Box>
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ alignItems: { xs: "stretch", sm: "center" } }}
          >
          <TextField
            fullWidth
            label="Domicilio"
            value={domicilio?.nombre ?? ""}
            onChange={(e) => actualizarDomicilio({ nombre: e.target.value })}
          />
          <IconButton
            size="small"
            onClick={ocultarDomicilio}
            sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}
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
      domicilios={domicilios}
      nombreElegido={nombreElegido}
      setNombreElegido={setNombreElegido}
      onCargarOtro={cargarOtroDomicilio}
      onConfirmar={confirmarSeleccion}
    />
  );
};

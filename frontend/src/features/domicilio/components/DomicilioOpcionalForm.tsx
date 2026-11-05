import { useState } from "react";
import { Alert, Stack, Box, Button, IconButton, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ProvinciaComponent } from "./ProvinciaComponent";
import { DepartamentoComponent } from "./DepartamentoComponet";
import { DomicilioSelect } from "./Domicilio/DomicilioSelect";

import type { Departamento, DomicilioFormData, Provincia } from "../types";
import { editarDomicilioManual } from "../utils";
import { useUbicacionDomicilio } from "./useUbicacionDomicilio";

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
  const [indiceElegido, setIndiceElegido] = useState("");
  const ubicacion = useUbicacionDomicilio({
    id: condicion ? domicilio?.id_departamento ?? null : null,
    provincia, departamento, setProvincia, setDepartamento,
  });

  const actualizarDomicilio = (cambios: Partial<DomicilioFormData>) => {
    setDomicilio(editarDomicilioManual(domicilio, cambios));
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
    const encontrado = indiceElegido === "" ? undefined : domicilios[Number(indiceElegido)];
    if (encontrado) {
      setDomicilio(encontrado);
      setMostrarFormulario(true);
    }
  };

  const cargarOtroDomicilio = () => {
    setDomicilio(nuevoDomicilio());
    setProvincia(null);
    setDepartamento(null);
    setIndiceElegido("");
    setMostrarFormulario(true);
  };

  const ocultarDomicilio = () => {
    setDomicilio(null);
    setProvincia(null);
    setDepartamento(null);
    setIndiceElegido("");
    setMostrarFormulario(true);
    mostrar(false);
  };

  if (mostrarFormulario) {
      return (
        <Stack spacing={1}>
          {ubicacion.cargando && <Alert severity="info">Cargando provincia y departamento del domicilio…</Alert>}
          {ubicacion.error && <Alert severity="warning" action={<Button onClick={ubicacion.reintentar}>Reintentar</Button>}>{ubicacion.error}</Alert>}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Box sx={{ flex: 1 }}>
                <ProvinciaComponent
                  disabled={ubicacion.cargando}
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
                    key={provincia?.id ?? "sin-provincia"}
                    disabled={ubicacion.cargando || provincia === null}
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
            aria-label="Quitar domicilio"
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
      indiceElegido={indiceElegido}
      setIndiceElegido={setIndiceElegido}
      onCargarOtro={cargarOtroDomicilio}
      onConfirmar={confirmarSeleccion}
    />
  );
};

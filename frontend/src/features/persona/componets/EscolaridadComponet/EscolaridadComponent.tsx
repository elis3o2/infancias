import { useEffect, useState } from "react";
import {Typography, Paper, Button} from "@mui/material";
import { getEscolaridad } from "@/features/persona/api";
import type { Escolaridad } from "@/features/persona/types";
import type { Setter } from "@/common/types";
import { EscolaridadForm } from "./components/EscolaridadForm";
import { EscuelaForm } from "./components/EscuelaForm";
import { EscolarizadoForm } from "./components/EscolarizadoForm";
import { EscolaridadResumen } from "./components/EscolaridadResument";

type Props = {
  escolarizado: boolean
  setEscolarizado: Setter<boolean>;
  escolaridadSeleccionada: Escolaridad | null
  setEscolaridadSeleccionada: Setter<Escolaridad | null>;
  escuela: string
  setEscuela: Setter<string>;
  finishEscolaridad: boolean
  setFinishEscolaridad: Setter<boolean>;
};

export const EscolaridadComponent = ({escolarizado, setEscolarizado, escolaridadSeleccionada, setEscolaridadSeleccionada, 
                                      escuela, setEscuela, finishEscolaridad, setFinishEscolaridad,}: Props) => {
  const [opcionesEscolaridad, setOpcionesEscolaridad] = useState<Escolaridad[]>([])
  useEffect(() => {
    getEscolaridad().then(setOpcionesEscolaridad).catch(console.error);
  }, []);

  return finishEscolaridad? (
      <EscolaridadResumen 
        escolarizado={escolarizado}
        escolaridadSeleccionada={escolaridadSeleccionada}
        escuela={escuela}
        setFinishEscolaridad={setFinishEscolaridad}
      /> ) :
      (
    <Paper elevation={2} sx={{ p: 4,  width: "100%" }}>
      <Typography variant="h6" fontWeight={600} mb={3}>
        Información de Escolaridad
      </Typography>

      {/* ¿Está escolarizado actualmente? */}
      <EscolarizadoForm
        escolarizado={escolarizado}
        setEscolarizado={setEscolarizado}
      />

      {/* Nivel de escolaridad alcanzado */}
      <EscolaridadForm
        escolaridadSeleccionada={escolaridadSeleccionada}
        setEscolaridadSeleccionada={setEscolaridadSeleccionada} 
        escolaridades={opcionesEscolaridad}
      />

      {/* Escuela a la que asistió */}
      <EscuelaForm 
        escuela={escuela}
        setEscuela={setEscuela}
      />

      <Button
        variant="contained"
        fullWidth
        onClick={() => setFinishEscolaridad(true)}  
        color="info"
        disabled={escolaridadSeleccionada === null || escuela === ""}
        sx={{ borderRadius: 2, fontWeight: 600, textTransform: "none", py: 1.25, mt: 2 }}
      >
        Confirmar
      </Button>
    </Paper>
  );
};
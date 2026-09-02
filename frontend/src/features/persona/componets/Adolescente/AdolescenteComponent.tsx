import { useState } from "react";
import type { Setter } from "@/common/types";
import { AdolescenteInicial, type AdolescenteCreate } from "../../types";
import { AdolescenteForm } from "./AdolescenteForm";
import { ConditionalCard } from "@/common/components/ConditionalCard";
import { AdolescentesList } from "./AdolescentesList";
import type { DomicilioFormData } from "@/features/domicilio/types";
import { Button } from "@mui/material";

type Props = {
  adolescentes: AdolescenteCreate[];
  setAdolescentes: Setter<AdolescenteCreate[]>;
  domicilios: DomicilioFormData[]
  setDomicilios: Setter<DomicilioFormData[]>
};

export const AdolescenteComponent = ({ adolescentes, setAdolescentes, domicilios, setDomicilios }: Props) => {
  
  const [adolescente, setAdolescente] = useState<AdolescenteCreate>(AdolescenteInicial);
  const [finishAdolescente, setFinishAdolescente] = useState(false);
  const [editando, setEditando] = useState(false);

  const agregarAdolescente = () => {
    setAdolescentes([
      ...adolescentes,
      adolescente,
    ]);

    setAdolescente(AdolescenteInicial);
    setFinishAdolescente(true);
  };

  const editarAdolescente = (index: number) => {
    const adolescenteEditar = adolescentes[index];

    // Cargarlo en el formulario
    setAdolescente(adolescenteEditar);

    // Sacarlo de la lista definitivamente
    setAdolescentes(
      adolescentes.filter((_, i) => i !== index)
    );

    setEditando(true);
    setFinishAdolescente(false);
  };

  const guardarEdicion = () => {
    setAdolescentes([
      ...adolescentes,
      adolescente,
    ]);

    setAdolescente(AdolescenteInicial);
    setEditando(false);
    setFinishAdolescente(true);
  };

  const cancelarCarga = () => {
    setAdolescente(AdolescenteInicial);
    setEditando(false);
    setFinishAdolescente(true);
  };

  const agregarOtro = () => {
    setAdolescente(AdolescenteInicial);
    setEditando(false);
    setFinishAdolescente(false);
  };

  return (
    <ConditionalCard
      titulo="Niños, Niñas y Adolescentes"
      condicion={finishAdolescente && adolescentes.length > 0}
      componenteTrue={
        <>
          <AdolescentesList
            adolescentes={adolescentes}
            onEditar={editarAdolescente}
          />

          <Button
            variant="outlined"
            onClick={agregarOtro}
          >
            Agregar otro
          </Button>
        </>
      }
      componenteFalse={
        <>
          <AdolescentesList
            adolescentes={adolescentes}
            onEditar={editarAdolescente}
          />

          <AdolescenteForm
            adolescente={adolescente}
            setAdolescente={setAdolescente}
            onCargar={
              editando
                ? guardarEdicion
                : agregarAdolescente
            }
            domicilios={domicilios}
            onCancelar={cancelarCarga}
            setDomicilios={setDomicilios}
          />
        </>
      }
    />
  );
};